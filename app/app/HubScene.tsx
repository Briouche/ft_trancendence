'use client'

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, RoundedBox, Sparkles, Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import Lantern from '@/components/home-library/Lantern'
import Candle from '@/components/home-library/Candle'
import { PALETTE, ATMOSPHERE } from '@/components/home-library/theme'
import { MENU_ITEMS, type MenuItem } from './menu'
import AccountMenu, { type WinsBreakdown, type CardBacksSummary } from '../components/account-menu/AccountMenu'

// The hub: a 3D library hall (three-fiber) ringed by bookshelves, with one clickable prop per
// menu destination (armchair, card table, cellar door, librarian, tuto board).

// Unmounting the Canvas (logout, entering a match) makes three-fiber force-lose the WebGL context
// on purpose to free the GPU, and three then logs "Context Lost." for that normal teardown.
THREE.setConsoleFunction((type, message, ...params) => {
    if (message === 'THREE.WebGLRenderer: Context Lost.') return
    console[type](message, ...params)
})

// Bookshelf ring geometry (degrees around the camera) and prop placement.
const RING_RADIUS = 5.6
const GAME_DOOR_ANGLE = 0
const SHELF_RING_ANGLES = [-91, -78, -65, -52, -39, -26, 26, 39, 52, 65, 78, 91]
const DOOR_FLANK_ANGLES = [-20, 20]
const TORCH_ANGLES = [-65, -26, 26, 65]
const TORCH_HEIGHT = 2.15
const PROP_RADIUS = 4.2
const LABEL_Y = 1.85

type Variant = 'books' | 'table' | 'librarian' | 'door' | 'tuto'
type Layout = { angleDeg: number; radius: number; variant: Variant }

const LAYOUT: Record<string, Layout> = {
    '/collection': { angleDeg: -56, radius: PROP_RADIUS, variant: 'books' },
    '/deck': { angleDeg: -28, radius: PROP_RADIUS, variant: 'table' },
    '/play': { angleDeg: GAME_DOOR_ANGLE, radius: RING_RADIUS, variant: 'door' },
    '/packs': { angleDeg: 28, radius: PROP_RADIUS, variant: 'librarian' },
    '/manual': { angleDeg: 56, radius: PROP_RADIUS, variant: 'tuto' },
}

function polar(angleDeg: number, radius: number): [number, number] {
    const a = (angleDeg * Math.PI) / 180
    return [Math.sin(a) * radius, -Math.cos(a) * radius]
}

// Deterministic 0..1 value, so procedural details don't reshuffle between renders.
function pseudoRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453
    return x - Math.floor(x)
}

const SHELF_ROWS = 5
const BOOKS_PER_ROW = 8

// Shelves and rows of procedurally varied books (one instanced mesh per bookshelf).
function Bookshelf({ position, rotationY = 0, seed = 0 }: { position: [number, number, number]; rotationY?: number; seed?: number }) {
    const shelfColors = [PALETTE.leather700, PALETTE.leather800, PALETTE.ink700, PALETTE.leather900]
    const booksRef = useRef<THREE.InstancedMesh>(null)

    const books = useMemo(() => {
        const list: { x: number; y: number; w: number; h: number; tilt: number; color: string }[] = []
        for (let row = 0; row < SHELF_ROWS; row++) {
            const shelfY = 0.32 + row * 0.58
            const rowCount = BOOKS_PER_ROW - Math.round(pseudoRandom(seed * 331 + row * 71) * 2)
            const rowStartX = -0.78 + pseudoRandom(seed * 197 + row * 53) * 0.16
            for (let i = 0; i < rowCount; i++) {
                const s = seed * 977 + row * 131 + i * 17
                const w = 0.14 + pseudoRandom(s) * 0.08
                const h = 0.34 + pseudoRandom(s + 5.3) * 0.14
                const tilt = (pseudoRandom(s + 11.1) - 0.5) * 0.16
                const color = shelfColors[Math.floor(pseudoRandom(s + 21.6) * shelfColors.length)]
                const x = rowStartX + i * (1.56 / BOOKS_PER_ROW)
                list.push({ x, y: shelfY + h / 2, w, h, tilt, color })
            }
        }
        return list
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seed])

    useLayoutEffect(() => {
        const mesh = booksRef.current
        if (!mesh) return
        const dummy = new THREE.Object3D()
        books.forEach((b, i) => {
            dummy.position.set(b.x, b.y, 0.1)
            dummy.rotation.set(0, 0, b.tilt)
            dummy.scale.set(b.w, b.h, 0.34)
            dummy.updateMatrix()
            mesh.setMatrixAt(i, dummy.matrix)
            mesh.setColorAt(i, new THREE.Color(b.color))
        })
        mesh.instanceMatrix.needsUpdate = true
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }, [books])

    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {Array.from({ length: SHELF_ROWS }).map((_, row) => (
                <mesh key={row} position={[0, 0.32 + row * 0.58 - 0.02, 0.1]} receiveShadow>
                    <boxGeometry args={[1.82, 0.04, 0.42]} />
                    <meshStandardMaterial color={PALETTE.leather800} roughness={0.75} />
                </mesh>
            ))}
            <instancedMesh ref={booksRef} args={[undefined, undefined, books.length]} receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={PALETTE.leather700} roughness={0.8} />
            </instancedMesh>
        </group>
    )
}

type CaissonPlacement = { position: [number, number, number]; rotationY: number }

// All bookshelf cabinets as a single instanced mesh.
function BookshelfCaissons({ shelves }: { shelves: CaissonPlacement[] }) {
    const ref = useRef<THREE.InstancedMesh>(null)

    useLayoutEffect(() => {
        const mesh = ref.current
        if (!mesh) return
        const dummy = new THREE.Object3D()
        shelves.forEach((s, i) => {
            dummy.position.set(s.position[0], s.position[1] + 1.65, s.position[2])
            dummy.rotation.set(0, s.rotationY, 0)
            dummy.updateMatrix()
            mesh.setMatrixAt(i, dummy.matrix)
        })
        mesh.instanceMatrix.needsUpdate = true
    }, [shelves])

    return (
        <instancedMesh ref={ref} args={[undefined, undefined, shelves.length]} castShadow receiveShadow>
            <boxGeometry args={[1.9, 3.3, 0.5]} />
            <meshStandardMaterial color={PALETTE.leather900} roughness={0.9} />
        </instancedMesh>
    )
}

// Wall sconce with a small candle.
function WallTorch({ position, rotationY }: { position: [number, number, number]; rotationY: number }) {
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            <mesh position={[0, 0, 0.09]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.01, 0.01, 0.14, 6]} />
                <meshStandardMaterial color="#1c1d1f" roughness={0.5} metalness={0.5} />
            </mesh>
            <Candle position={[0, 0, 0.16]} scale={0.34} />
            <pointLight position={[0, 0.03, 0.2]} color="#ffb066" intensity={2.6} distance={5.5} decay={2} />
        </group>
    )
}

// Brass oil lamp with a flickering glass globe.
function OldLamp({ position }: { position: [number, number, number] }) {
    const glassRef = useRef<THREE.Mesh>(null)

    useFrame(({ clock }) => {
        if (!glassRef.current) return
        const mat = glassRef.current.material as THREE.MeshStandardMaterial
        const t = clock.getElapsedTime()
        mat.emissiveIntensity = 1.5 + Math.sin(t * 6.5) * 0.16 + Math.sin(t * 12.3) * 0.08
    })

    return (
        <group position={position}>
            <mesh position={[0, 0.05, 0]} castShadow>
                <cylinderGeometry args={[0.09, 0.12, 0.1, 16]} />
                <meshStandardMaterial color={PALETTE.gold600} metalness={0.6} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.18, 0]}>
                <cylinderGeometry args={[0.015, 0.02, 0.18, 8]} />
                <meshStandardMaterial color={PALETTE.gold600} metalness={0.6} roughness={0.35} />
            </mesh>
            <mesh ref={glassRef} position={[0, 0.34, 0]}>
                <sphereGeometry args={[0.11, 16, 16]} />
                <meshStandardMaterial color="#fff2c4" emissive="#ffb066" emissiveIntensity={1.5} roughness={0.3} transparent opacity={0.85} toneMapped={false} />
            </mesh>
            <pointLight position={[0, 0.34, 0]} color="#ffb066" intensity={1.3} distance={3.5} decay={2} />
        </group>
    )
}

// Small closed chest on the librarian's counter.
function TableChest({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <RoundedBox args={[0.32, 0.18, 0.22]} radius={0.02} smoothness={1} position={[0, 0.09, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather800} roughness={0.6} />
            </RoundedBox>
            <RoundedBox args={[0.34, 0.08, 0.24]} radius={0.03} smoothness={1} position={[0, 0.22, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.55} />
            </RoundedBox>
            <mesh position={[0, 0.13, 0.115]}>
                <boxGeometry args={[0.045, 0.055, 0.02]} />
                <meshStandardMaterial color={PALETTE.gold500} metalness={0.6} roughness={0.3} />
            </mesh>
        </group>
    )
}

// Hooded silhouette behind a counter, with glowing eyes that glance around.
function Librarian({ locked }: { locked: boolean }) {
    const eyesRef = useRef<THREE.Group>(null)

    useFrame((state, delta) => {
        if (!eyesRef.current) return
        const t = state.clock.getElapsedTime()
        const holdIndex = Math.floor(t / 1.6)
        const targetX = (pseudoRandom(holdIndex * 3.7) - 0.5) * 0.07
        eyesRef.current.position.x = THREE.MathUtils.damp(eyesRef.current.position.x, targetX, 14, delta)
    })

    return (
        <group>
            <RoundedBox args={[1.1, 0.5, 0.55]} radius={0.04} smoothness={1} position={[0, 0.25, 0.48]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather800} roughness={0.6} />
            </RoundedBox>
            <OldLamp position={[-0.32, 0.5, 0.35]} />
            <TableChest position={[0.22, 0.5, 0.5]} />

            <mesh position={[0, 0.6, 0]} castShadow>
                <cylinderGeometry args={[0.26, 0.26, 1.2, 24]} />
                <meshStandardMaterial color={PALETTE.ink900} roughness={0.9} />
            </mesh>
            <mesh position={[0, 1.2, 0]} castShadow>
                <sphereGeometry args={[0.26, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color={PALETTE.ink900} roughness={0.9} />
            </mesh>

            {!locked && (
                <>
                    <mesh position={[0, 1.17, 0.26]} scale={[1, 0.85, 0.09]}>
                        <sphereGeometry args={[0.18, 16, 12]} />
                        <meshBasicMaterial color="#050505" />
                    </mesh>

                    <group ref={eyesRef} position={[0, 1.17, 0.285]}>
                        <mesh position={[-0.08, 0, 0]} scale={[1.3, 0.4, 1]}>
                            <sphereGeometry args={[0.028, 10, 8]} />
                            <meshStandardMaterial color={PALETTE.gold400} emissive={PALETTE.gold400} emissiveIntensity={12} toneMapped={false} />
                        </mesh>
                        <mesh position={[0.08, 0, 0]} scale={[1.3, 0.4, 1]}>
                            <sphereGeometry args={[0.028, 10, 8]} />
                            <meshStandardMaterial color={PALETTE.gold400} emissive={PALETTE.gold400} emissiveIntensity={12} toneMapped={false} />
                        </mesh>
                    </group>
                </>
            )}

            <pointLight position={[0, 0.6, 0.3]} color={PALETTE.gold500} intensity={0.45} distance={2.8} decay={2} />
        </group>
    )
}

function Armchair() {
    const legs: [number, number][] = [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]
    return (
        <group>
            <RoundedBox args={[0.5, 0.14, 0.46]} radius={0.05} smoothness={1} position={[0, 0.28, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather700} roughness={0.75} />
            </RoundedBox>
            <RoundedBox args={[0.5, 0.56, 0.14]} radius={0.06} smoothness={1} position={[0, 0.58, -0.18]} rotation={[-0.14, 0, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather700} roughness={0.75} />
            </RoundedBox>
            {[-1, 1].map(side => (
                <RoundedBox key={side} args={[0.1, 0.22, 0.4]} radius={0.04} smoothness={1} position={[side * 0.26, 0.42, -0.02]} castShadow receiveShadow>
                    <meshStandardMaterial color={PALETTE.leather800} roughness={0.75} />
                </RoundedBox>
            ))}
            {legs.map(([x, z], i) => (
                <mesh key={i} position={[x, 0.11, z]} castShadow>
                    <cylinderGeometry args={[0.025, 0.03, 0.22, 8]} />
                    <meshStandardMaterial color={PALETTE.leather900} roughness={0.6} />
                </mesh>
            ))}
        </group>
    )
}

function NightTable({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <RoundedBox args={[0.28, 0.44, 0.28]} radius={0.02} smoothness={1} position={[0, 0.26, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.7} />
            </RoundedBox>
            <RoundedBox args={[0.34, 0.04, 0.34]} radius={0.015} smoothness={1} position={[0, 0.5, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather800} roughness={0.6} />
            </RoundedBox>
            <mesh position={[0, 0.28, 0.145]}>
                <boxGeometry args={[0.06, 0.01, 0.01]} />
                <meshStandardMaterial color={PALETTE.gold500} metalness={0.5} roughness={0.4} />
            </mesh>
        </group>
    )
}

// Open red book on a tilted stand.
function OpenBookOnStand({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            <RoundedBox args={[0.3, 0.03, 0.16]} radius={0.012} smoothness={1} position={[0, 0.015, 0.05]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.7} />
            </RoundedBox>
            <group position={[0, 0.03, -0.02]} rotation={[-0.6, 0, 0]}>
                <RoundedBox args={[0.3, 0.02, 0.22]} radius={0.01} smoothness={1} position={[0, 0, 0.11]} castShadow receiveShadow>
                    <meshStandardMaterial color={PALETTE.leather800} roughness={0.7} />
                </RoundedBox>
                <mesh position={[0, 0.014, 0.11]}>
                    <boxGeometry args={[0.28, 0.012, 0.21]} />
                    <meshStandardMaterial color="#7a1c1c" roughness={0.55} />
                </mesh>
                <mesh position={[-0.065, 0.022, 0.11]} rotation={[0, 0, 0.06]}>
                    <boxGeometry args={[0.12, 0.01, 0.19]} />
                    <meshStandardMaterial color={PALETTE.parchment100} roughness={0.9} />
                </mesh>
                <mesh position={[0.065, 0.022, 0.11]} rotation={[0, 0, -0.06]}>
                    <boxGeometry args={[0.12, 0.01, 0.19]} />
                    <meshStandardMaterial color={PALETTE.parchment100} roughness={0.9} />
                </mesh>
                <mesh position={[0, 0.024, 0.11]}>
                    <boxGeometry args={[0.012, 0.014, 0.19]} />
                    <meshStandardMaterial color={PALETTE.leather700} roughness={0.7} />
                </mesh>
            </group>
        </group>
    )
}

// Tall lamp with a flickering globe.
function FloorLamp({ position }: { position: [number, number, number] }) {
    const glassRef = useRef<THREE.Mesh>(null)

    useFrame(({ clock }) => {
        if (!glassRef.current) return
        const mat = glassRef.current.material as THREE.MeshStandardMaterial
        const t = clock.getElapsedTime()
        mat.emissiveIntensity = 1.6 + Math.sin(t * 6.5) * 0.16 + Math.sin(t * 12.3) * 0.08
    })

    return (
        <group position={position}>
            <mesh position={[0, 0.02, 0]} castShadow>
                <cylinderGeometry args={[0.13, 0.15, 0.04, 20]} />
                <meshStandardMaterial color={PALETTE.gold600} metalness={0.6} roughness={0.35} />
            </mesh>
            <mesh position={[0, 0.5, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.025, 0.96, 10]} />
                <meshStandardMaterial color={PALETTE.gold600} metalness={0.55} roughness={0.4} />
            </mesh>
            <mesh ref={glassRef} position={[0, 1.02, 0]}>
                <sphereGeometry args={[0.14, 16, 16]} />
                <meshStandardMaterial color="#fff2c4" emissive="#ffb066" emissiveIntensity={1.6} roughness={0.3} transparent opacity={0.85} toneMapped={false} />
            </mesh>
            <pointLight position={[0, 1.02, 0]} color="#ffb066" intensity={1.6} distance={4} decay={2} />
        </group>
    )
}

// "Collection" prop: armchair, nightstand with an open book, floor lamp.
function CollectionProps() {
    return (
        <group>
            <Armchair />
            <NightTable position={[0.55, 0, 0.1]} />
            <OpenBookOnStand position={[0.55, 0.52, 0.02]} rotationY={Math.PI + 0.15} />
            <FloorLamp position={[-0.52, 0, 0.05]} />
        </group>
    )
}

type DeckTableCard = { x: number; z: number; rot: number; face: string; sleeve: string }

// "Deck Builder" prop: round table with scattered sleeved cards and a candle.
function DeckTable() {
    const cards = useMemo<DeckTableCard[]>(
        () => Array.from({ length: 6 }).map((_, i) => ({
            x: (pseudoRandom(i * 4.1) - 0.5) * 0.7,
            z: (pseudoRandom(i * 8.3) - 0.5) * 0.7,
            rot: pseudoRandom(i * 15.2) * Math.PI * 2,
            face: [PALETTE.parchment200, PALETTE.parchment100, PALETTE.gold500][i % 3],
            sleeve: [PALETTE.ink900, PALETTE.leather900, '#2b3a4a'][i % 3],
        })),
        [],
    )

    const sleeveRef = useRef<THREE.InstancedMesh>(null)
    const faceRef = useRef<THREE.InstancedMesh>(null)

    useLayoutEffect(() => {
        const sleeve = sleeveRef.current
        const face = faceRef.current
        if (!sleeve || !face) return
        const dummy = new THREE.Object3D()
        cards.forEach((c, i) => {
            dummy.rotation.set(0, c.rot, 0)

            dummy.position.set(c.x, 0.565 + i * 0.004, c.z)
            dummy.updateMatrix()
            sleeve.setMatrixAt(i, dummy.matrix)
            sleeve.setColorAt(i, new THREE.Color(c.sleeve))

            dummy.position.set(c.x, 0.565 + i * 0.004 + 0.009, c.z)
            dummy.updateMatrix()
            face.setMatrixAt(i, dummy.matrix)
            face.setColorAt(i, new THREE.Color(c.face))
        })
        sleeve.instanceMatrix.needsUpdate = true
        if (sleeve.instanceColor) sleeve.instanceColor.needsUpdate = true
        face.instanceMatrix.needsUpdate = true
        if (face.instanceColor) face.instanceColor.needsUpdate = true
    }, [cards])

    return (
        <group>
            <mesh position={[0, 0.52, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.62, 0.56, 0.07, 28]} />
                <meshStandardMaterial color={PALETTE.leather800} roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.25, 0]} castShadow>
                <cylinderGeometry args={[0.07, 0.09, 0.5, 12]} />
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.65} />
            </mesh>
            <instancedMesh ref={sleeveRef} args={[undefined, undefined, cards.length]} castShadow>
                <boxGeometry args={[0.19, 0.012, 0.26]} />
                <meshStandardMaterial roughness={0.5} />
            </instancedMesh>
            <instancedMesh ref={faceRef} args={[undefined, undefined, cards.length]} castShadow>
                <boxGeometry args={[0.155, 0.005, 0.225]} />
                <meshStandardMaterial roughness={0.75} />
            </instancedMesh>
            <Candle position={[0.36, 0.555 + 0.275 * 0.42, 0.3]} scale={0.42} />
        </group>
    )
}

// "Game room" prop: wooden door in a stone frame, set into the bookshelf ring.
function CellarDoor() {
    const halfWidth = 0.82
    const doorHeight = 2.8
    const frameHeight = doorHeight + 0.4
    const lintelY = frameHeight - 0.13
    return (
        <group>
            <RoundedBox args={[0.22, frameHeight, 0.34]} radius={0.03} smoothness={1} position={[-halfWidth - 0.08, frameHeight / 2, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.ink700} roughness={0.9} />
            </RoundedBox>
            <RoundedBox args={[0.22, frameHeight, 0.34]} radius={0.03} smoothness={1} position={[halfWidth + 0.08, frameHeight / 2, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.ink700} roughness={0.9} />
            </RoundedBox>
            <RoundedBox args={[(halfWidth + 0.08) * 2 + 0.22, 0.26, 0.34]} radius={0.03} smoothness={1} position={[0, lintelY, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.ink700} roughness={0.9} />
            </RoundedBox>

            <RoundedBox args={[halfWidth * 2, doorHeight, 0.12]} radius={0.02} smoothness={1} position={[0, doorHeight / 2 + 0.05, 0.05]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.85} />
            </RoundedBox>
            {[-0.35, -0.12, 0.12, 0.35].map(x => (
                <mesh key={x} position={[x, doorHeight / 2 + 0.05, 0.115]}>
                    <boxGeometry args={[0.015, doorHeight - 0.12, 0.008]} />
                    <meshStandardMaterial color={PALETTE.leather700} roughness={0.8} />
                </mesh>
            ))}
            {[0.35, 1.1, doorHeight - 0.25].map(y => (
                <mesh key={y} position={[0, y, 0.115]} castShadow>
                    <boxGeometry args={[halfWidth * 2 - 0.06, 0.05, 0.015]} />
                    <meshStandardMaterial color="#1c1d1f" roughness={0.5} metalness={0.5} />
                </mesh>
            ))}
            <mesh position={[halfWidth - 0.18, doorHeight / 2 - 0.1, 0.11]}>
                <boxGeometry args={[0.06, 0.08, 0.015]} />
                <meshStandardMaterial color="#1c1d1f" roughness={0.5} metalness={0.5} />
            </mesh>
            <mesh position={[halfWidth - 0.18, doorHeight / 2 - 0.1, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.055, 0.013, 8, 16]} />
                <meshStandardMaterial color={PALETTE.gold500} metalness={0.6} roughness={0.3} />
            </mesh>

            <pointLight position={[0, 0.12, 0.25]} color="#3a4550" intensity={0.5} distance={2} decay={2} />
        </group>
    )
}

type TutoNote = { tex: string; x: number; y: number; w: number; h: number; rot: number; pin: string }

// Notes pinned on the tuto board (sizes hand-tuned per texture).
const TUTO_NOTES: TutoNote[] = [
    { tex: '/textures/notebook/banner01.webp', x: 0, y: 0.42, w: 1.3, h: 0.22, rot: -0.02, pin: '#c0392b' },
    { tex: '/textures/collection/icon-leg-timmy.webp', x: -1.05, y: -0.06, w: 0.36, h: 0.38, rot: 0.08, pin: '#2980b9' },
    { tex: '/textures/collection/icon-leg-freddy.webp', x: -0.63, y: -0.06, w: 0.36, h: 0.38, rot: -0.06, pin: '#27ae60' },
    { tex: '/textures/cards/frame/frame-commune.webp', x: -0.21, y: -0.06, w: 0.34, h: 0.5, rot: -0.09, pin: '#2980b9' },
    { tex: '/textures/notebook/slot.webp', x: 0.21, y: -0.06, w: 0.3, h: 0.3, rot: 0.08, pin: '#e0a72b' },
    { tex: '/textures/collection/icon-leg-jeffe.webp', x: 0.63, y: -0.06, w: 0.36, h: 0.38, rot: 0.05, pin: '#c0392b' },
    { tex: '/textures/collection/icon-leg-gertrude.webp', x: 1.05, y: -0.06, w: 0.36, h: 0.38, rot: -0.07, pin: '#27ae60' },
]

function TutoNoteMesh({ note, texture }: { note: TutoNote; texture: THREE.Texture }) {
    return (
        <group position={[note.x, note.y, 0.05]} rotation={[0, 0, note.rot]}>
            <mesh castShadow>
                <planeGeometry args={[note.w, note.h]} />
                <meshStandardMaterial map={texture} roughness={0.85} transparent />
            </mesh>
            <mesh position={[0, note.h / 2 - 0.02, 0.01]}>
                <circleGeometry args={[0.02, 12]} />
                <meshStandardMaterial color={note.pin} roughness={0.4} metalness={0.3} />
            </mesh>
        </group>
    )
}

// "Tuto" prop: corkboard on a stand covered in pinned notes.
function TutoBoard() {
    const textures = useTexture(TUTO_NOTES.map(n => n.tex))

    useLayoutEffect(() => {
        textures.forEach(t => {
            t.magFilter = THREE.NearestFilter
            t.minFilter = THREE.NearestFilter
            t.needsUpdate = true
        })
    }, [textures])

    return (
        <group rotation={[-0.05, 0, 0]}>
            <RoundedBox args={[1.1, 0.08, 0.32]} radius={0.02} smoothness={1} position={[0, 0.04, -0.08]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.8} />
            </RoundedBox>
            {[-0.42, 0.42].map(x => (
                <mesh key={x} position={[x, 0.34, -0.08]} castShadow>
                    <boxGeometry args={[0.07, 0.6, 0.07]} />
                    <meshStandardMaterial color={PALETTE.leather800} roughness={0.75} />
                </mesh>
            ))}

            <group position={[0, 1.065, 0]} scale={0.5}>
                <RoundedBox args={[2.8, 1.5, 0.07]} radius={0.03} smoothness={1} position={[0, -0.1, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color={PALETTE.leather900} roughness={0.85} />
                </RoundedBox>
                <mesh position={[0, -0.1, 0.036]} receiveShadow>
                    <planeGeometry args={[2.66, 1.36]} />
                    <meshStandardMaterial color={PALETTE.gold500} roughness={0.95} />
                </mesh>

                {TUTO_NOTES.map((note, i) => (
                    <TutoNoteMesh key={note.tex} note={note} texture={textures[i]} />
                ))}
            </group>
        </group>
    )
}

// One menu destination: its prop, a label, and an invisible cylinder as the click/hover zone.
function Hotspot3D({ item, layout, hovered, onHoverChange, onArrive }: {
    item: MenuItem
    layout: Layout
    hovered: boolean
    onHoverChange: (href: string | null) => void
    onArrive: (item: MenuItem) => void
}) {
    const locked = !item.available
    const groupRef = useRef<THREE.Group>(null)
    const [x, z] = polar(layout.angleDeg, layout.radius)
    const facingRotationY = -(layout.angleDeg * Math.PI) / 180
    const hitHeight = LABEL_Y + 0.4
    const hitRadius = 0.85

    useFrame((state, delta) => {
        if (!groupRef.current) return
        const targetScale = hovered && !locked ? 1.05 : 1
        groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 7, delta))
    })

    return (
        <group
            ref={groupRef}
            position={[x, 0, z]}
            rotation={[0, facingRotationY, 0]}
            onPointerOver={e => { e.stopPropagation(); onHoverChange(item.href) }}
            onPointerOut={() => onHoverChange(null)}
            onClick={e => { e.stopPropagation(); if (!locked) onArrive(item) }}
        >
            <mesh position={[0, hitHeight / 2, 0]}>
                <cylinderGeometry args={[hitRadius, hitRadius, hitHeight, 16]} />
                <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {layout.variant === 'librarian' && <Librarian locked={locked} />}
            {layout.variant === 'books' && <CollectionProps />}
            {layout.variant === 'table' && <DeckTable />}
            {layout.variant === 'door' && <CellarDoor />}
            {layout.variant === 'tuto' && <TutoBoard />}

            {/* zIndexRange: drei's default (up to 16777271) would put labels above the z-50 title and account menu. */}
            <Html position={[0, LABEL_Y, 0]} center zIndexRange={[40, 0]} className="pointer-events-none">
                <div className="text-center whitespace-nowrap">
                    <div
                        className="font-engraved tracking-wide text-4xl [text-shadow:0_2px_10px_rgba(0,0,0,0.95),0_0_18px_rgba(0,0,0,0.6)]"
                        style={{ color: locked ? '#8a8d90' : (hovered ? PALETTE.gold300 : PALETTE.parchment200) }}
                    >
                        {item.label}
                    </div>
                    {locked && <div className="font-serif text-xs text-[#8a8d90]">Locked</div>}
                </div>
            </Html>
        </group>
    )
}

// Radial-gradient texture shared by every smoke and mist sprite.
let smokeTexture: THREE.Texture | null = null
function getSmokeTexture(): THREE.Texture {
    if (smokeTexture) return smokeTexture
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    smokeTexture = new THREE.CanvasTexture(canvas)
    return smokeTexture
}

// Rising, fading smoke sprites.
function Smoke({ position, count = 5 }: { position: [number, number, number]; count?: number }) {
    const texture = useMemo(() => getSmokeTexture(), [])
    const refs = useRef<(THREE.Sprite | null)[]>([])

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime()
        for (let i = 0; i < count; i++) {
            const sprite = refs.current[i]
            if (!sprite) continue
            const phase = (t * 0.12 + i / count) % 1
            sprite.position.set(
                Math.sin(i * 12.9) * 0.05 + phase * 0.06,
                phase * 0.85,
                Math.cos(i * 7.3) * 0.05,
            )
            sprite.scale.setScalar(0.12 + phase * 0.3)
            const material = sprite.material as THREE.SpriteMaterial
            material.opacity = Math.sin(phase * Math.PI) * 0.18
        }
    })

    return (
        <group position={position}>
            {Array.from({ length: count }).map((_, i) => (
                <sprite key={i} ref={(el: THREE.Sprite | null) => { refs.current[i] = el }}>
                    <spriteMaterial map={texture} color="#4a4038" transparent depthWrite={false} />
                </sprite>
            ))}
        </group>
    )
}

// Slowly drifting translucent planes standing in for floor/ceiling mist.
function RoomMist({ y, facingDown = false, radius = 8, count = 3, opacity = 0.1, color = '#333a40' }: {
    y: number
    facingDown?: boolean
    radius?: number
    count?: number
    opacity?: number
    color?: string
}) {
    const texture = useMemo(() => getSmokeTexture(), [])
    const refs = useRef<(THREE.Mesh | null)[]>([])
    const tilt = facingDown ? Math.PI / 2 : -Math.PI / 2

    useFrame(({ clock }, delta) => {
        const t = clock.getElapsedTime()
        for (let i = 0; i < count; i++) {
            const mesh = refs.current[i]
            if (!mesh) continue
            mesh.rotation.z += delta * 0.012 * (i % 2 === 0 ? 1 : -1)
            mesh.position.x = Math.sin(t * 0.06 + i * 2.1) * radius * 0.08
            mesh.position.z = Math.cos(t * 0.05 + i * 1.7) * radius * 0.08
            const material = mesh.material as THREE.MeshBasicMaterial
            material.opacity = opacity * (0.7 + 0.3 * Math.sin(t * 0.25 + i * 2.4))
        }
    })

    return (
        <group position={[0, y, 0]}>
            {Array.from({ length: count }).map((_, i) => (
                <mesh key={i} ref={(el: THREE.Mesh | null) => { refs.current[i] = el }} rotation={[tilt, 0, (i * Math.PI) / count]}>
                    <planeGeometry args={[radius * 2, radius * 2]} />
                    <meshBasicMaterial map={texture} color={color} transparent opacity={opacity} depthWrite={false} />
                </mesh>
            ))}
        </group>
    )
}

function Brazier({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <mesh position={[0, 0.19, 0]} castShadow>
                <cylinderGeometry args={[0.11, 0.14, 0.38, 14]} />
                <meshStandardMaterial color={PALETTE.ink700} roughness={0.6} metalness={0.2} />
            </mesh>
            <Candle position={[0, 0.38 + 0.275 * 0.55, 0]} scale={0.55} />
            <Smoke position={[0, 0.75, 0]} />
        </group>
    )
}

// Moth circling the brazier.
function Moth({ center }: { center: [number, number, number] }) {
    const ref = useRef<THREE.Group>(null)
    const phase = useMemo(() => Math.random() * Math.PI * 2, [])

    useFrame(({ clock }) => {
        if (!ref.current) return
        const t = clock.getElapsedTime() * 0.7 + phase
        ref.current.position.set(
            center[0] + Math.cos(t) * 0.45,
            center[1] + Math.sin(t * 1.8) * 0.14,
            center[2] + Math.sin(t) * 0.45,
        )
        ref.current.rotation.y = -t
        ref.current.scale.set(1 + Math.sin(t * 15) * 0.55, 1, 1)
    })

    return (
        <group ref={ref}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.05, 8]} />
                <meshStandardMaterial color="#141414" side={THREE.DoubleSide} />
            </mesh>
        </group>
    )
}

// Lights, mist, bookshelf ring, torches, the five hotspots and the brazier.
function HallScene({ hoveredHref, onHoverChange, onArrive }: {
    hoveredHref: string | null
    onHoverChange: (href: string | null) => void
    onArrive: (item: MenuItem) => void
}) {
    const [baX, baZ] = polar(-32, 5.0)

    const shelfCaissonPlacements = useMemo<CaissonPlacement[]>(() => [
        ...SHELF_RING_ANGLES.map(angleDeg => {
            const [sx, sz] = polar(angleDeg, RING_RADIUS)
            return { position: [sx, 0, sz] as [number, number, number], rotationY: -(angleDeg * Math.PI) / 180 }
        }),
        ...DOOR_FLANK_ANGLES.map(angleDeg => {
            const [sx, sz] = polar(angleDeg, RING_RADIUS)
            return { position: [sx, 0, sz] as [number, number, number], rotationY: -(angleDeg * Math.PI) / 180 }
        }),
    ], [])

    return (
        <>
            <color attach="background" args={[ATMOSPHERE.background]} />
            <fog attach="fog" args={[ATMOSPHERE.background, 16, 38]} />
            <ambientLight intensity={2.8} color={ATMOSPHERE.ambientColor} />
            <directionalLight position={[2, 6, 3]} intensity={2.1} color="#c9cdd2" castShadow shadow-mapSize={[512, 512]} />
            <Sparkles count={45} scale={[14, 4, 12]} position={[0, 1.8, -4]} size={1.6} speed={0.2} opacity={0.18} color="#8a8478" />
            <Lantern mode="mouse-track" distance={7} spreadX={2.6} spreadY={1.6} lightIntensity={4} lightAngle={0.26} lightDistance={6} />

            <RoomMist y={0.12} radius={5} count={3} opacity={0.08} color="#6b7178" />
            <RoomMist y={4.4} facingDown radius={5.5} count={2} opacity={0.06} color="#8a7a63" />

            <BookshelfCaissons shelves={shelfCaissonPlacements} />
            {SHELF_RING_ANGLES.map((angleDeg, i) => {
                const [sx, sz] = polar(angleDeg, RING_RADIUS)
                return <Bookshelf key={i} position={[sx, 0, sz]} rotationY={-(angleDeg * Math.PI) / 180} seed={i + 1} />
            })}
            {DOOR_FLANK_ANGLES.map((angleDeg, i) => {
                const [sx, sz] = polar(angleDeg, RING_RADIUS)
                return <Bookshelf key={`flank-${i}`} position={[sx, 0, sz]} rotationY={-(angleDeg * Math.PI) / 180} seed={100 + i} />
            })}

            {TORCH_ANGLES.map(angleDeg => {
                const [tx, tz] = polar(angleDeg, RING_RADIUS - 0.15)
                return <WallTorch key={angleDeg} position={[tx, TORCH_HEIGHT, tz]} rotationY={-(angleDeg * Math.PI) / 180} />
            })}

            {MENU_ITEMS.map(item => (
                <Hotspot3D
                    key={item.href}
                    item={item}
                    layout={LAYOUT[item.href]}
                    hovered={hoveredHref === item.href}
                    onHoverChange={onHoverChange}
                    onArrive={onArrive}
                />
            ))}

            <Brazier position={[baX, 0, baZ]} />
            <Moth center={[baX, 0.9, baZ]} />
        </>
    )
}

// Camera with a constant horizontal fov (derived from fov 56 at 16:9), so the row of hotspots
// stays framed whatever the window's aspect ratio.
const REFERENCE_ASPECT = 16 / 9
const REFERENCE_VERTICAL_FOV_DEG = 56
const HORIZONTAL_FOV_RAD = 2 * Math.atan(Math.tan((REFERENCE_VERTICAL_FOV_DEG * Math.PI / 180) / 2) * REFERENCE_ASPECT)
const MIN_VERTICAL_FOV_DEG = 40
const MAX_VERTICAL_FOV_DEG = 100

function HubCamera() {
    const { width, height } = useThree(state => state.size)
    const aspect = width / height || REFERENCE_ASPECT
    const verticalFovDeg = (2 * Math.atan(Math.tan(HORIZONTAL_FOV_RAD / 2) / aspect)) * 180 / Math.PI
    const clampedFov = Math.min(MAX_VERTICAL_FOV_DEG, Math.max(MIN_VERTICAL_FOV_DEG, verticalFovDeg))

    return (
        <PerspectiveCamera makeDefault position={[0, 1.75, 3.0]} fov={clampedFov} onUpdate={c => c.lookAt(0, 1.6, -2.4)} />
    )
}

// `active` stops the render loop while the hub is hidden behind another route.
export default function HubScene({ username, cardCount, elo, wins, cardBacks, active = true }: {
    username:  string
    cardCount: number
    elo:       number
    wins:      WinsBreakdown
    cardBacks: CardBacksSummary
    active?:   boolean
}) {
    const router = useRouter()
    const [hoveredHref, setHoveredHref] = useState<string | null>(null)
    const arrivingRef = useRef(false)

    useEffect(() => {
        if (active) arrivingRef.current = false
    }, [active])

    function handleArrive(item: MenuItem) {
        if (arrivingRef.current) return
        arrivingRef.current = true
        router.push(item.href)
    }

    const locked = hoveredHref !== null && !MENU_ITEMS.find(i => i.href === hoveredHref)?.available

    return (
        <div
            className={`relative h-screen w-full select-none overflow-hidden bg-ink-950
                ${hoveredHref ? (locked ? 'cursor-not-allowed' : 'cursor-pointer') : 'cursor-default'}`}
        >
            <Canvas shadows="percentage" dpr={[1, 1.5]} gl={{ antialias: true }} frameloop={active ? 'always' : 'never'}>
                <HubCamera />
                <Suspense fallback={null}>
                    <HallScene hoveredHref={hoveredHref} onHoverChange={setHoveredHref} onArrive={handleArrive} />
                </Suspense>
            </Canvas>

            <div className="pointer-events-none absolute inset-x-0 top-8 z-50 flex justify-center">
                <h1
                    className="font-engraved tracking-wide text-parchment-200 [text-shadow:0_3px_10px_rgba(0,0,0,0.9)]"
                    style={{ fontSize: 'clamp(2.5rem, 6vw, 6rem)' }}
                >
                    ft_transcendence
                </h1>
            </div>

            <AccountMenu username={username} cardCount={cardCount} elo={elo} wins={wins} cardBacks={cardBacks} />
        </div>
    )
}
