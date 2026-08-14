'use client'

import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import RoomFrame from '@/components/library/RoomFrame'
import { PALETTE } from '@/components/library/theme'

type Phase = 'idle' | 'shaking' | 'revealing'

// Angle du couvercle (radians, pivote sur la charnière arrière) et couleur de la lueur
// intérieure, selon la phase d'ouverture du paquet.
const LID_ANGLE: Record<Phase, number> = { idle: 0, shaking: 0, revealing: -2.2 }
const GLOW_COLOR: Record<Phase, string> = { idle: PALETTE.leather700, shaking: '#e0a03a', revealing: PALETTE.gold400 }
const GLOW_INTENSITY: Record<Phase, number> = { idle: 0.8, shaking: 2.2, revealing: 5 }

// Le coffre réagit à la phase d'ouverture du paquet : il tremble pendant "shaking" (même
// idée que l'ancien CSS pack-shake, mais un vrai déplacement 3D), et son couvercle pivote sur
// une vraie charnière (rotation autour du bord arrière) pendant "revealing" — plus un rotateX
// CSS approximatif.
function Chest({ phase }: { phase: Phase }) {
    const group = useRef<THREE.Group>(null)
    const lid = useRef<THREE.Group>(null)
    const glow = useRef<THREE.PointLight>(null)

    useFrame((state, delta) => {
        if (lid.current) {
            lid.current.rotation.x = THREE.MathUtils.damp(lid.current.rotation.x, LID_ANGLE[phase], 6, delta)
        }

        if (group.current) {
            if (phase === 'shaking') {
                const t = state.clock.getElapsedTime()
                group.current.position.x = Math.sin(t * 26) * 0.05
                group.current.rotation.z = Math.sin(t * 22) * 0.04
            } else {
                group.current.position.x = THREE.MathUtils.damp(group.current.position.x, 0, 8, delta)
                group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, 0, 8, delta)
            }
        }

        if (glow.current) {
            glow.current.intensity = THREE.MathUtils.damp(glow.current.intensity, GLOW_INTENSITY[phase], 5, delta)
        }
    })

    const color = GLOW_COLOR[phase]

    return (
        <group ref={group} position={[0, 0, 1.4]}>
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
    )
}

export default function VaultRoom({ phase, children }: { phase: Phase; children: ReactNode }) {
    return (
        <RoomFrame decor={<Chest phase={phase} />}>
            {children}
        </RoomFrame>
    )
}
