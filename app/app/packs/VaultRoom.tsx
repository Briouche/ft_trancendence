'use client'

import { useRef, useState, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, RoundedBox, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import Atmosphere from '@/components/library/Atmosphere'
import Lantern from '@/components/library/Lantern'
import MouseParallaxRig from '@/components/library/MouseParallaxRig'
import { PALETTE } from '@/components/library/theme'

type Phase = 'idle' | 'shaking' | 'revealing'

// Angle du couvercle (radians, pivote sur la charnière arrière) et couleur de la lueur
// intérieure, selon la phase d'ouverture du paquet.
const LID_ANGLE: Record<Phase, number> = { idle: 0, shaking: 0, revealing: -2.2 }
const GLOW_COLOR: Record<Phase, string> = { idle: PALETTE.leather700, shaking: '#e0a03a', revealing: PALETTE.gold400 }
const GLOW_INTENSITY: Record<Phase, number> = { idle: 0.8, shaking: 2.2, revealing: 5 }

// Le coffre réagit à la phase d'ouverture du paquet : il tremble pendant "shaking", son couvercle
// pivote sur une vraie charnière pendant "revealing". C'est maintenant lui-même le bouton
// d'ouverture (onClick), avec un léger grossissement au survol — même retour discret que le bord
// du livre dans la Collection, pas un halo fort.
function Chest({ phase, openEnabled, onOpen }: { phase: Phase; openEnabled: boolean; onOpen: () => void }) {
    const shakeGroup = useRef<THREE.Group>(null)
    const hoverGroup = useRef<THREE.Group>(null)
    const lid = useRef<THREE.Group>(null)
    const glow = useRef<THREE.PointLight>(null)
    const [hovered, setHovered] = useState(false)

    useFrame((state, delta) => {
        if (lid.current) {
            lid.current.rotation.x = THREE.MathUtils.damp(lid.current.rotation.x, LID_ANGLE[phase], 6, delta)
        }

        if (shakeGroup.current) {
            if (phase === 'shaking') {
                const t = state.clock.getElapsedTime()
                shakeGroup.current.position.x = Math.sin(t * 26) * 0.05
                shakeGroup.current.rotation.z = Math.sin(t * 22) * 0.04
            } else {
                shakeGroup.current.position.x = THREE.MathUtils.damp(shakeGroup.current.position.x, 0, 8, delta)
                shakeGroup.current.rotation.z = THREE.MathUtils.damp(shakeGroup.current.rotation.z, 0, 8, delta)
            }
        }

        if (hoverGroup.current) {
            const targetScale = hovered && openEnabled ? 1.06 : 1
            const next = THREE.MathUtils.damp(hoverGroup.current.scale.x, targetScale, 10, delta)
            hoverGroup.current.scale.setScalar(next)
        }

        if (glow.current) {
            glow.current.intensity = THREE.MathUtils.damp(glow.current.intensity, GLOW_INTENSITY[phase], 5, delta)
        }
    })

    const color = GLOW_COLOR[phase]

    return (
        <group
            ref={hoverGroup}
            onClick={() => openEnabled && onOpen()}
            onPointerOver={() => { if (openEnabled) { setHovered(true); document.body.style.cursor = 'pointer' } }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'auto' }}
        >
            <group ref={shakeGroup}>
                <RoundedBox args={[1.15, 0.62, 0.72]} radius={0.06} smoothness={4} position={[0, 0.31, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={PALETTE.leather800} roughness={0.55} />
                </RoundedBox>

                {/* Couvercle : charnière posée sur le bord arrière du coffre, pas au centre */}
                <group position={[0, 0.62, -0.36]} ref={lid}>
                    <RoundedBox args={[1.18, 0.3, 0.76]} radius={0.08} smoothness={4} position={[0, 0.11, 0.38]} castShadow receiveShadow>
                        <meshStandardMaterial color={PALETTE.leather900} roughness={0.5} />
                    </RoundedBox>
                </group>

                <mesh position={[0, 0.42, 0.37]} castShadow>
                    <sphereGeometry args={[0.07, 16, 16]} />
                    <meshStandardMaterial color={PALETTE.gold500} metalness={0.6} roughness={0.3} />
                </mesh>

                {/* Lueur intérieure : orbe organique (distordu, pas une sphère lisse) qui suit la phase */}
                <mesh position={[0, 0.5, 0]} visible={phase !== 'idle'}>
                    <icosahedronGeometry args={[0.22, 4]} />
                    <MeshDistortMaterial
                        color={color}
                        emissive={color}
                        emissiveIntensity={1.6}
                        distort={0.35}
                        speed={2.5}
                        roughness={0.2}
                        toneMapped={false}
                    />
                </mesh>
                <pointLight ref={glow} position={[0, 0.6, 0]} color={color} distance={5} decay={2} />
            </group>
        </group>
    )
}

// Salle du coffre : plus de RoomFrame/RoomCanvas partagé (calé pour une table vue de loin) — le
// coffre est ici le centre de l'attention, donc une caméra dédiée qui le cadre bien au milieu de
// l'écran plutôt que bas et petit.
export default function VaultRoom({
    phase, openEnabled, onOpen, children,
}: {
    phase:       Phase
    openEnabled: boolean
    onOpen:      () => void
    children:    ReactNode
}) {
    return (
        <div className="relative min-h-screen w-full bg-ink-950">
            <div className="fixed inset-0 overflow-hidden">
                <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
                    <PerspectiveCamera makeDefault position={[0, 1.15, 3.2]} fov={38} onUpdate={c => c.lookAt(0, 0.45, 0)} />
                    <Atmosphere />
                    <Lantern mode="mouse-track" distance={6} spreadX={2.5} spreadY={1.5} />
                    <MouseParallaxRig strength={0.5} vertical={0.3} />

                    <directionalLight position={[3, 6, 4]} intensity={0.9} color="#fff2df" castShadow shadow-mapSize={[1024, 1024]} />
                    <directionalLight position={[-4, 3, -3]} intensity={0.25} color="#8fb8ff" />

                    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <circleGeometry args={[16, 64]} />
                        <meshStandardMaterial color={PALETTE.ink800} roughness={0.6} metalness={0.15} />
                    </mesh>

                    <Chest phase={phase} openEnabled={openEnabled} onOpen={onOpen} />
                </Canvas>
            </div>
            {/* pointer-events-none : ce wrapper (comme le div plein écran de PackOpener à
                l'intérieur) ne doit pas intercepter les clics destinés au coffre dans le Canvas
                en dessous — chaque élément interactif repasse en pointer-events-auto. */}
            <div className="relative z-10 pointer-events-none">
                {children}
            </div>
        </div>
    )
}
