'use client'

import { useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Sparkles, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import CardFace, { type CardFaceData } from '@/components/CardFace'

type Card = CardFaceData & { ownedQty: number }

const HALF_WIDTH   = 1.7
const BOOK_HEIGHT  = 2.4
const SPINE_WIDTH  = 0.16
const PAGE_DEPTH   = 0.22
const CARD_PX      = 560
const DISTANCE_FACTOR = 0.7
const FLIP_THRESHOLD   = 0.35
const FLIP_DURATION_MS = 550

type FlipState = { direction: 'next' | 'prev'; progress: number } | null

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
}

function CardGrid({ cards }: { cards: Card[] }) {
    return (
        <div
            style={{
                width: CARD_PX, height: CARD_PX * 1.28,
                display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(3, 1fr)',
                gap: 14, padding: 14,
            }}
        >
            {cards.length === 0 && (
                <p style={{
                    gridColumn: '1 / -1', alignSelf: 'center', textAlign: 'center',
                    fontStyle: 'italic', color: '#6b4226',
                }}>
                    Aucune carte
                </p>
            )}
            {cards.map(card => (
                <CardFace key={card.id} card={card} ownedQty={card.ownedQty} />
            ))}
        </div>
    )
}

// Une demi-page statique (celle qui ne tourne pas), posée à plat sur la pile de pages.
function PageStack({ side, cards }: { side: 'left' | 'right'; cards: Card[] }) {
    const x = side === 'left' ? -(SPINE_WIDTH / 2 + HALF_WIDTH / 2) : (SPINE_WIDTH / 2 + HALF_WIDTH / 2)
    return (
        <group position={[x, BOOK_HEIGHT / 2, 0]}>
            <mesh position={[0, 0, PAGE_DEPTH / 2 - 0.02]} castShadow receiveShadow>
                <boxGeometry args={[HALF_WIDTH, BOOK_HEIGHT, PAGE_DEPTH]} />
                <meshStandardMaterial color="#e6d3a3" roughness={0.95} />
            </mesh>
            <Html transform distanceFactor={DISTANCE_FACTOR} position={[0, 0, PAGE_DEPTH]} center>
                <CardGrid cards={cards} />
            </Html>
        </group>
    )
}

// La page qui tourne : recto/verso, pivot vertical sur la reliure (x = 0), même logique
// (recto = page actuelle, verso pré-tourné à 180° autour de son propre centre) que la
// version CSS, mais en vraie 3D — donc une vraie rotation, une vraie perspective.
function FlippingPage({
    side, flip, front, back,
}: {
    side: 'left' | 'right'
    flip: FlipState
    front: Card[]
    back: Card[]
}) {
    const isTurning = flip !== null && (
        (side === 'right' && flip.direction === 'next') ||
        (side === 'left'  && flip.direction === 'prev')
    )
    if (!isTurning || !flip) return null

    const sign         = side === 'right' ? -1 : 1
    const angle         = sign * flip.progress * Math.PI
    const localX        = side === 'left' ? -HALF_WIDTH / 2 : HALF_WIDTH / 2
    const facingFront    = flip.progress < 0.5

    return (
        <group position={[side === 'right' ? SPINE_WIDTH / 2 : -SPINE_WIDTH / 2, BOOK_HEIGHT / 2, 0]}
            rotation={[0, angle, 0]}>
            <group position={[localX, 0, PAGE_DEPTH]}>
                <Html
                    transform
                    distanceFactor={DISTANCE_FACTOR}
                    center
                    style={{ visibility: facingFront ? 'visible' : 'hidden', backfaceVisibility: 'hidden' }}
                >
                    <div style={{ position: 'relative' }}>
                        <CardGrid cards={front} />
                        <div
                            style={{
                                position: 'absolute', inset: 0, background: 'black', pointerEvents: 'none',
                                opacity: Math.min(0.5, flip.progress * 0.7),
                            }}
                        />
                    </div>
                </Html>
                <group rotation={[0, Math.PI, 0]}>
                    <Html
                        transform
                        distanceFactor={DISTANCE_FACTOR}
                        center
                        style={{ visibility: facingFront ? 'hidden' : 'visible', backfaceVisibility: 'hidden' }}
                    >
                        <div style={{ position: 'relative' }}>
                            <CardGrid cards={back} />
                            <div
                                style={{
                                    position: 'absolute', inset: 0, background: 'black', pointerEvents: 'none',
                                    opacity: Math.min(0.5, (1 - flip.progress) * 0.7),
                                }}
                            />
                        </div>
                    </Html>
                </group>
            </group>
        </group>
    )
}

function Spine() {
    return (
        <mesh position={[0, BOOK_HEIGHT / 2, PAGE_DEPTH / 2]} castShadow receiveShadow>
            <boxGeometry args={[SPINE_WIDTH, BOOK_HEIGHT + 0.14, PAGE_DEPTH + 0.1]} />
            <meshStandardMaterial color="#331f13" roughness={0.6} />
        </mesh>
    )
}

function CoverEdge({ side }: { side: 'left' | 'right' }) {
    const x = side === 'left'
        ? -(SPINE_WIDTH / 2 + HALF_WIDTH + 0.05)
        : (SPINE_WIDTH / 2 + HALF_WIDTH + 0.05)
    return (
        <mesh position={[x, BOOK_HEIGHT / 2, PAGE_DEPTH / 2]} castShadow receiveShadow>
            <boxGeometry args={[0.1, BOOK_HEIGHT + 0.14, PAGE_DEPTH + 0.1]} />
            <meshStandardMaterial color="#4a2d1a" roughness={0.6} />
        </mesh>
    )
}

function Candle({ position }: { position: [number, number, number] }) {
    const flameRef = useRef<THREE.Mesh>(null)
    useFrame(({ clock }) => {
        if (!flameRef.current) return
        const t = clock.getElapsedTime()
        flameRef.current.scale.setScalar(1 + Math.sin(t * 9) * 0.08 + Math.sin(t * 17) * 0.04)
    })
    return (
        <group position={position}>
            <mesh castShadow>
                <cylinderGeometry args={[0.11, 0.13, 0.55, 16]} />
                <meshStandardMaterial color="#f2e6c9" roughness={0.7} />
            </mesh>
            <mesh ref={flameRef} position={[0, 0.36, 0]}>
                <coneGeometry args={[0.05, 0.16, 8]} />
                <meshStandardMaterial color="#ffb347" emissive="#ff8c1a" emissiveIntensity={2.2} toneMapped={false} />
            </mesh>
            <pointLight position={[0, 0.4, 0]} color="#ffb066" intensity={1.4} distance={4} decay={2} />
        </group>
    )
}

function Vial({ position, hue }: { position: [number, number, number]; hue: number }) {
    const liquidRef = useRef<THREE.Mesh>(null)
    useFrame(({ clock }) => {
        if (!liquidRef.current) return
        const mat = liquidRef.current.material as THREE.MeshStandardMaterial
        const t = clock.getElapsedTime()
        mat.color.setHSL((hue + Math.sin(t * 0.3) * 0.06) % 1, 0.65, 0.5)
        mat.emissive.setHSL((hue + Math.sin(t * 0.3) * 0.06) % 1, 0.7, 0.35)
    })
    return (
        <group position={position}>
            <mesh castShadow>
                <cylinderGeometry args={[0.09, 0.09, 0.34, 16, 1, true]} />
                <meshStandardMaterial color="#dfe8ea" roughness={0.1} transparent opacity={0.25} side={THREE.DoubleSide} />
            </mesh>
            <mesh position={[0, -0.06, 0]} ref={liquidRef}>
                <cylinderGeometry args={[0.075, 0.075, 0.16, 16]} />
                <meshStandardMaterial emissiveIntensity={0.8} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0.19, 0]}>
                <cylinderGeometry args={[0.03, 0.04, 0.06, 8]} />
                <meshStandardMaterial color="#4a2d1a" roughness={0.8} />
            </mesh>
        </group>
    )
}

function ScurryingMouse() {
    const ref = useRef<THREE.Group>(null)
    useFrame(({ clock }) => {
        if (!ref.current) return
        const cycle = 22
        const t = (clock.getElapsedTime() % cycle) / cycle
        const active = t < 0.18
        ref.current.visible = active
        if (active) {
            const p = t / 0.18
            ref.current.position.x = -4.5 + p * 9
            ref.current.position.z = 2.6 + Math.sin(p * Math.PI) * 0.3
        }
    })
    return (
        <group ref={ref} position={[-5, 0.09, 2.6]}>
            <mesh castShadow scale={[1, 0.75, 1.3]}>
                <sphereGeometry args={[0.11, 12, 12]} />
                <meshStandardMaterial color="#5a5048" roughness={0.9} />
            </mesh>
            <mesh position={[0.14, 0.03, 0]} castShadow>
                <sphereGeometry args={[0.06, 10, 10]} />
                <meshStandardMaterial color="#5a5048" roughness={0.9} />
            </mesh>
            <mesh position={[-0.13, 0.02, 0]} rotation={[0, 0, -0.3]}>
                <coneGeometry args={[0.02, 0.28, 6]} />
                <meshStandardMaterial color="#3a332e" roughness={0.9} />
            </mesh>
        </group>
    )
}

function LooseCard({ position, rotation }: { position: [number, number, number]; rotation: number }) {
    return (
        <mesh position={position} rotation={[-Math.PI / 2, 0, rotation]} castShadow receiveShadow>
            <boxGeometry args={[0.5, 0.7, 0.02]} />
            <meshStandardMaterial color="#f2e6c9" roughness={0.85} />
        </mesh>
    )
}

function Scene({
    leftCards, rightCards, flip, backCards,
}: {
    leftCards: Card[]
    rightCards: Card[]
    flip: FlipState
    backCards: Card[]
}) {
    return (
        <>
            <color attach="background" args={['#0a0704']} />
            <fog attach="fog" args={['#0a0704', 7, 16]} />

            <ambientLight intensity={0.55} color="#8a7a5c" />
            <directionalLight
                position={[3, 6, 4]}
                intensity={1.3}
                color="#fff2df"
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <directionalLight position={[-4, 3, -3]} intensity={0.35} color="#8fb8ff" />

            <Sparkles count={40} scale={[6, 3, 4]} size={2} speed={0.25} opacity={0.35} color="#d4af37" />

            {/* La table */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[30, 30]} />
                <meshStandardMaterial color="#4a3320" roughness={0.55} metalness={0.1} />
            </mesh>

            {/* Le livre, légèrement penché en arrière comme sur un lutrin */}
            <group rotation={[-0.16, 0, 0]}>
                <PageStack side="left" cards={leftCards} />
                <PageStack side="right" cards={rightCards} />
                <Spine />
                <CoverEdge side="left" />
                <CoverEdge side="right" />
                <FlippingPage side="left" flip={flip} front={leftCards} back={backCards} />
                <FlippingPage side="right" flip={flip} front={rightCards} back={backCards} />
            </group>

            <Candle position={[-2.5, 0.3, 1.9]} />
            <Vial position={[2.15, 0.17, 1.6]} hue={0.36} />
            <Vial position={[2.4, 0.17, 1.95]} hue={0.82} />
            <Vial position={[2.6, 0.17, 1.4]} hue={0.12} />
            <LooseCard position={[-2.0, 0.011, 2.5]} rotation={0.3} />
            <LooseCard position={[-1.7, 0.011, 2.7]} rotation={-0.5} />
            <ScurryingMouse />
        </>
    )
}

export type BookSceneProps = {
    leftCards: Card[]
    rightCards: Card[]
    canGoPrev: boolean
    canGoNext: boolean
    onFlipStart: (direction: 'next' | 'prev') => void
    onFlipMove: (deltaRatio: number) => void
    onFlipEnd: () => void
    flip: FlipState
    backCards: Card[]
}

export default function BookScene({
    leftCards, rightCards, canGoPrev, canGoNext, onFlipStart, onFlipMove, onFlipEnd, flip, backCards,
}: BookSceneProps) {
    const dragStartX = useRef<number | null>(null)

    function startDrag(direction: 'next' | 'prev') {
        return (e: React.PointerEvent<HTMLDivElement>) => {
            dragStartX.current = e.clientX
            onFlipStart(direction)
            e.currentTarget.setPointerCapture(e.pointerId)
        }
    }

    function onMove(e: React.PointerEvent<HTMLDivElement>) {
        if (dragStartX.current === null) return
        const width = (e.currentTarget.parentElement?.offsetWidth ?? 800) / 2
        onFlipMove((e.clientX - dragStartX.current) / width)
    }

    function onUp() {
        if (dragStartX.current === null) return
        dragStartX.current = null
        onFlipEnd()
    }

    return (
        <div className="relative h-[640px] w-full">
            <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
                <PerspectiveCamera makeDefault position={[0, 2.5, 6.5]} fov={32} onUpdate={c => c.lookAt(0, 1.55, 0)} />
                <Scene leftCards={leftCards} rightCards={rightCards} flip={flip} backCards={backCards} />
            </Canvas>

            {canGoPrev && (
                <div
                    onPointerDown={startDrag('prev')}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                    title="Cliquer ou glisser pour revenir en arrière"
                    className="absolute inset-y-0 left-0 w-1/4 cursor-pointer touch-none"
                />
            )}
            {canGoNext && (
                <div
                    onPointerDown={startDrag('next')}
                    onPointerMove={onMove}
                    onPointerUp={onUp}
                    onPointerCancel={onUp}
                    title="Cliquer ou glisser pour tourner la page"
                    className="absolute inset-y-0 right-0 w-1/4 cursor-pointer touch-none"
                />
            )}
        </div>
    )
}
