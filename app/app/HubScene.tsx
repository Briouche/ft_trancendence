'use client'

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, RoundedBox, Sparkles, Html, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import Lantern from '@/components/library/Lantern'
import Candle from '@/components/library/Candle'
import { PALETTE, ATMOSPHERE } from '@/components/library/theme'
import { MENU_ITEMS, type MenuItem } from './menu'
import AccountMenu, { type WinsBreakdown, type CardBacksSummary } from './AccountMenu'

// The hall: a real room in three-fiber, enclosed by a ring of bookshelves. No visible floor
// plane — just furniture and doors placed in the dark/fog, like a row of lit elements rather
// than a fully modeled room. The 4 doors aren't the same base duplicated: each has its own
// furniture — a stack of books + an old lamp, a table with scattered cards, the librarian
// behind his counter, and the cellar door set into the bookshelf wall like a real gate.

// A regular grid at 13° spacing: each bookshelf (19.3° wide at the chosen radius) overlaps its
// neighbors generously rather than leaving a gap. The ring spans -73° to 83° (156°) — well wider
// than what the camera can ever see even at a wide FOV — so its end (and the "void" behind it) is
// never visible at the screen edges. GAME_DOOR_ANGLE occupies one of these slots (neighboring
// shelves overlap into it, so there's no gap even though the door itself is narrower).
const RING_RADIUS = 5.6
// The cellar door sits dead-center (0°) among the hall's 5 spots
// (Collection/Deck/Door/Librarian/Tuto), with two empty slots on either side for clearance.
// DOOR_FLANK_ANGLES add one extra bookshelf flush against each edge of the door frame so the
// door stays visually attached to the wall instead of floating in that clearance gap.
const GAME_DOOR_ANGLE = 0
const SHELF_RING_ANGLES = [-91, -78, -65, -52, -39, -26, 26, 39, 52, 65, 78, 91]
const DOOR_FLANK_ANGLES = [-20, 20]
// Wall torches, mounted on some of these bookshelves (not all — just enough to light the room
// in spots, without recreating the uniform wash we want to avoid).
const TORCH_ANGLES = [-65, -26, 26, 65]
const TORCH_HEIGHT = 2.15

type Variant = 'books' | 'table' | 'librarian' | 'door' | 'tuto'
type Layout = { angleDeg: number; radius: number; variant: Variant }

// Radius for the 4 floor-standing elements, kept well under RING_RADIUS so they stay in front
// of the bookshelf wall rather than poking into it. Left-to-right order, even 30° spacing:
// Collection, Deck, Door (Game room), Librarian, Tuto, with the door dead-center (0°) and the
// other 4 spread symmetrically around it. Sharing one radius keeps them all the same apparent
// size (same camera distance) — the door alone stays embedded in the wall at RING_RADIUS.
const PROP_RADIUS = 4.2

const LAYOUT: Record<string, Layout> = {
    '/collection': { angleDeg: -56, radius: PROP_RADIUS, variant: 'books' },
    '/deck': { angleDeg: -28, radius: PROP_RADIUS, variant: 'table' },
    '/play': { angleDeg: GAME_DOOR_ANGLE, radius: RING_RADIUS, variant: 'door' },
    '/packs': { angleDeg: 28, radius: PROP_RADIUS, variant: 'librarian' },
    '/manual': { angleDeg: 56, radius: PROP_RADIUS, variant: 'tuto' },
}

// Same height for all 4 labels (instead of one height per variant): easier to read at a
// glance, and consistent with the props now sharing the same distance.
const LABEL_Y = 1.85

function polar(angleDeg: number, radius: number): [number, number] {
    const a = (angleDeg * Math.PI) / 180
    return [Math.sin(a) * radius, -Math.cos(a) * radius]
}

// Deterministic hash (not Math.random): book rows and scattered cards must not visually
// reshuffle on every re-render (e.g. hovering another element that changes state higher up).
function pseudoRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453
    return x - Math.floor(x)
}

const SHELF_ROWS = 5
const BOOKS_PER_ROW = 8

// A wall bookshelf: a cabinet + rows of books with irregular width/height/tint/tilt (never two
// identical books). `seed` distinguishes each instance in the ring — without it every bookshelf
// used the same row/i calculation and ended up as visually identical copies despite the
// procedural geometry.
//
// Books are a single <instancedMesh> per bookshelf (~35 books in one draw call) rather than 35
// separate meshes: with ~12 bookshelves that was 400+ individual meshes, each casting a shadow —
// the actual cause of the slowdown.
function Bookshelf({ position, rotationY = 0, seed = 0 }: { position: [number, number, number]; rotationY?: number; seed?: number }) {
    const shelfColors = [PALETTE.leather700, PALETTE.leather800, PALETTE.ink700, PALETTE.leather900]
    const booksRef = useRef<THREE.InstancedMesh>(null)

    const books = useMemo(() => {
        const list: { x: number; y: number; w: number; h: number; tilt: number; color: string }[] = []
        for (let row = 0; row < SHELF_ROWS; row++) {
            const shelfY = 0.32 + row * 0.58
            // Each row slightly shifts its start point and book count: irregular edges, not a
            // perfect grid repeated on every shelf.
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
            {/* The cabinet isn't placed here anymore: all 12 are strictly identical (same
                size, same color), so a single shared instancedMesh (BookshelfCaissons,
                rendered once in HallScene) replaces all of them — see that component. */}
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

// The 12 bookshelf cabinets are geometrically identical (same [1.9, 3.3, 0.5] size, same
// leather900 color) — only position and rotation differ between bookshelves. A single
// instancedMesh (same idea as the books above) replaces 12 separate RoundedBox meshes with one
// geometry built once and a single draw call, instead of 12 of each. boxGeometry (sharp corners)
// instead of RoundedBox: the 0.03-unit chamfer on a cabinet this size, seen from a few meters in
// a dim torch-lit room, was imperceptible anyway — no color or proportion changes.
function BookshelfCaissons({ shelves }: { shelves: CaissonPlacement[] }) {
    const ref = useRef<THREE.InstancedMesh>(null)

    useLayoutEffect(() => {
        const mesh = ref.current
        if (!mesh) return
        const dummy = new THREE.Object3D()
        shelves.forEach((s, i) => {
            // Local offset [0, 1.65, 0] from the old nested cabinet: a rotation around Y alone
            // never changes a purely vertical vector, so adding it directly in world space
            // reproduces exactly the position the cabinet would have had nested inside its
            // bookshelf's rotated group.
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

// A wall-mounted torch, fixed onto a bookshelf cabinet — a real wall sconce rather than a
// floor-standing brazier: the iron arm is anchored into the cabinet's edge, the candle barely
// protrudes into the room (a torch, not a giant candle). Light is static for now (the animated
// glow was removed on request).
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

// An old oil lamp: brass base, glass globe that flickers gently — the light source
// illuminating the book stack beside it.
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

// A small closed chest on the librarian's counter — not the large pack chest (already used in
// VaultRoom), just a counter prop: base + lid + gold clasp.
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

// The librarian: a hooded, faceless silhouette behind his counter — just two points of light
// in the shadow of the hood that dart around furtively (small glances, not a regular sweep) to
// sell the impression that someone is really watching. An old lamp and a small chest sit on the
// counter in front of him.
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

            {/* A ghost, simply: a CONSTANT-width cylinder (no taper toward the top, so no
                "neck then head" effect) topped with a half-sphere of the exact same radius —
                one smooth, rounded silhouette, no point. */}
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
                    {/* Hood hollow, using meshBasicMaterial (not Standard, so it doesn't shade
                        itself). Kept at a safe z distance from the body surface to avoid
                        z-fighting (near-coincident faces flicker in a checkerboard pattern,
                        reading as a texture glitch on the face). */}
                    <mesh position={[0, 1.17, 0.26]} scale={[1, 0.85, 0.09]}>
                        <sphereGeometry args={[0.18, 16, 12]} />
                        <meshBasicMaterial color="#050505" />
                    </mesh>

                    {/* Eyes sit just in front of the hollow (small z gap, to avoid z-fighting)
                        and drift within a tight radius so they never stray past the hollow's
                        edge (0.18) during their glance animation. */}
                    <group ref={eyesRef} position={[0, 1.17, 0.285]}>
                        <mesh position={[-0.08, 0, 0]} scale={[1.3, 0.4, 1]}>
                            <sphereGeometry args={[0.028, 10, 8]} />
                            <meshStandardMaterial color={PALETTE.gold400} emissive={PALETTE.gold400} emissiveIntensity={12} toneMapped={false} />
                        </mesh>
                        <mesh position={[0.08, 0, 0]} scale={[1.3, 0.4, 1]}>
                            <sphereGeometry args={[0.028, 10, 8]} />
                            <meshStandardMaterial color={PALETTE.gold400} emissive={PALETTE.gold400} emissiveIntensity={12} toneMapped={false} />
                        </mesh>
                        {/* No pointLight here: the emissive material is enough to make the eyes
                            glow on their own, without lighting up (and washing out) the ghost
                            around them. */}
                    </group>
                </>
            )}

            <pointLight position={[0, 0.6, 0.3]} color={PALETTE.gold500} intensity={0.45} distance={2.8} decay={2} />
        </group>
    )
}

// A reading armchair: seat, backrest tilted slightly back, armrests, thin legs.
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

// The nightstand beside the armchair: a small top + a cabinet, holding the lamp and the big
// red book.
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

// The big red book, OPEN and resting on a small stand — so it reads as a book being read,
// not just a closed red block.
function OpenBookOnStand({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* Stand base, flat */}
            <RoundedBox args={[0.3, 0.03, 0.16]} radius={0.012} smoothness={1} position={[0, 0.015, 0.05]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.7} />
            </RoundedBox>
            {/* Tilted plane holding the book, angled like a real stand */}
            <group position={[0, 0.03, -0.02]} rotation={[-0.6, 0, 0]}>
                <RoundedBox args={[0.3, 0.02, 0.22]} radius={0.01} smoothness={1} position={[0, 0, 0.11]} castShadow receiveShadow>
                    <meshStandardMaterial color={PALETTE.leather800} roughness={0.7} />
                </RoundedBox>
                {/* Red cover, visible beneath the pages */}
                <mesh position={[0, 0.014, 0.11]}>
                    <boxGeometry args={[0.28, 0.012, 0.21]} />
                    <meshStandardMaterial color="#7a1c1c" roughness={0.55} />
                </mesh>
                {/* Two open pages, slightly bent on either side of the center spine */}
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

// A floor lamp, taller than a table lamp — on the opposite side of the armchair from the
// nightstand, to balance the composition rather than stacking both on the same side.
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

// The "Collection" door: a reading armchair, its nightstand with the open book on one side,
// the taller floor lamp on the other side to balance the composition.
function CollectionProps() {
    return (
        <group>
            <Armchair />
            <NightTable position={[0.55, 0, 0.1]} />
            {/* +PI: the stand is rotated so the pages face the room, not the wall */}
            <OpenBookOnStand position={[0.55, 0.52, 0.02]} rotationY={Math.PI + 0.15} />
            <FloorLamp position={[-0.52, 0, 0.05]} />
        </group>
    )
}

// The "Deck Builder" door's table: scattered cards, never aligned, on an old round table.
type DeckTableCard = { x: number; z: number; rot: number; face: string; sleeve: string }

function DeckTable() {
    const cards = useMemo<DeckTableCard[]>(
        () => Array.from({ length: 6 }).map((_, i) => ({
            x: (pseudoRandom(i * 4.1) - 0.5) * 0.7,
            z: (pseudoRandom(i * 8.3) - 0.5) * 0.7,
            rot: pseudoRandom(i * 15.2) * Math.PI * 2,
            // Face visible through the sleeve + the sleeve's own color — two distinct layers
            // (like a real card under a sleeve), not a single flat rectangle of one color.
            face: [PALETTE.parchment200, PALETTE.parchment100, PALETTE.gold500][i % 3],
            sleeve: [PALETTE.ink900, PALETTE.leather900, '#2b3a4a'][i % 3],
        })),
        [],
    )

    const sleeveRef = useRef<THREE.InstancedMesh>(null)
    const faceRef = useRef<THREE.InstancedMesh>(null)

    // Same idea as BookshelfCaissons: the 6 sleeves share one geometry, the 6 faces another —
    // only position/rotation/color differ per card. Two instancedMesh (per-instance color, like
    // the books) replace 12 separate RoundedBox meshes. boxGeometry (sharp corners): the original
    // corner radius (0.005/0.0015 units, a fraction of a millimeter at this scene's scale) was
    // already invisible.
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
            {/* A real two-layer stack rather than a flat single-color plane: the sleeve (a thin
                box, like a card-sleeve's plastic) and the face glimpsed through it, slightly
                recessed at the edges. */}
            <instancedMesh ref={sleeveRef} args={[undefined, undefined, cards.length]} castShadow>
                <boxGeometry args={[0.19, 0.012, 0.26]} />
                <meshStandardMaterial roughness={0.5} />
            </instancedMesh>
            <instancedMesh ref={faceRef} args={[undefined, undefined, cards.length]} castShadow>
                <boxGeometry args={[0.155, 0.005, 0.225]} />
                <meshStandardMaterial roughness={0.75} />
            </instancedMesh>
            {/* A real candle sitting on the table (instead of an invisible floating pointLight):
                the light source should be visible on the table, not just illuminate from
                nowhere. Candle is centered on its local origin (the body extends both above AND
                below `position`), so its y must be raised by its scaled half-height for the base
                to actually touch the tabletop (0.555) instead of being half-sunk into it. */}
            <Candle position={[0.36, 0.555 + 0.275 * 0.42, 0.3]} scale={0.42} />
        </group>
    )
}
// The cellar door: a real, good-sized solid wood door set into the bookshelf wall — stone
// frame, vertical planks, horizontal ironwork, ring and lock plate. No longer a prison gate: a
// door one could actually push open.
function CellarDoor() {
    const halfWidth = 0.82
    const doorHeight = 2.8
    // The frame is derived from doorHeight (not hardcoded) so it can never end up shorter than
    // the door leaf if the door's size is tweaked.
    const frameHeight = doorHeight + 0.4
    const lintelY = frameHeight - 0.13
    return (
        <group>
            {/* Stone frame */}
            <RoundedBox args={[0.22, frameHeight, 0.34]} radius={0.03} smoothness={1} position={[-halfWidth - 0.08, frameHeight / 2, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.ink700} roughness={0.9} />
            </RoundedBox>
            <RoundedBox args={[0.22, frameHeight, 0.34]} radius={0.03} smoothness={1} position={[halfWidth + 0.08, frameHeight / 2, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.ink700} roughness={0.9} />
            </RoundedBox>
            <RoundedBox args={[(halfWidth + 0.08) * 2 + 0.22, 0.26, 0.34]} radius={0.03} smoothness={1} position={[0, lintelY, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.ink700} roughness={0.9} />
            </RoundedBox>

            {/* Solid wood door leaf */}
            <RoundedBox args={[halfWidth * 2, doorHeight, 0.12]} radius={0.02} smoothness={1} position={[0, doorHeight / 2 + 0.05, 0.05]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.85} />
            </RoundedBox>
            {/* Vertical planks (visible seams) */}
            {[-0.35, -0.12, 0.12, 0.35].map(x => (
                <mesh key={x} position={[x, doorHeight / 2 + 0.05, 0.115]}>
                    <boxGeometry args={[0.015, doorHeight - 0.12, 0.008]} />
                    <meshStandardMaterial color={PALETTE.leather700} roughness={0.8} />
                </mesh>
            ))}
            {/* Horizontal ironwork */}
            {[0.35, 1.1, doorHeight - 0.25].map(y => (
                <mesh key={y} position={[0, y, 0.115]} castShadow>
                    <boxGeometry args={[halfWidth * 2 - 0.06, 0.05, 0.015]} />
                    <meshStandardMaterial color="#1c1d1f" roughness={0.5} metalness={0.5} />
                </mesh>
            ))}
            {/* Ring and lock plate */}
            <mesh position={[halfWidth - 0.18, doorHeight / 2 - 0.1, 0.11]}>
                <boxGeometry args={[0.06, 0.08, 0.015]} />
                <meshStandardMaterial color="#1c1d1f" roughness={0.5} metalness={0.5} />
            </mesh>
            <mesh position={[halfWidth - 0.18, doorHeight / 2 - 0.1, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.055, 0.013, 8, 16]} />
                <meshStandardMaterial color={PALETTE.gold500} metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Cold glow seeping under the door: keeps the "locked cellar" feel without a prison gate */}
            <pointLight position={[0, 0.12, 0.25]} color="#3a4550" intensity={0.5} distance={2} decay={2} />
        </group>
    )
}

// A "note" pinned on the board: a textured plane (a notebook/travelbook asset — legendary
// portrait, card frame, banner...), slightly askew, with a colored pin at the top. `w`/`h` are
// fixed per note rather than derived from the texture (each source has its own native ratio,
// simpler to hand-tune for 7 assets than to read dynamically).
type TutoNote = { tex: string; x: number; y: number; w: number; h: number; rot: number; pin: string }

// Landscape layout: a thin banner across the top, a single row of the other 6 notes below —
// designed for a wide, short panel, not the original portrait column.
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

// The Tuto board: a large panel (frame + corkboard) on a stand, covered in pinned notes —
// legendary portraits, a card frame, a banner — like a real investigation board rather than a
// plain sign. Detailed content (rules, glossary) lives on the /manual page; this board is only a
// 3D preview, not the tutorial itself.
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
            {/* Stand: a low base + two short posts, for a low, unobtrusive support (top at 0.64). */}
            <RoundedBox args={[1.1, 0.08, 0.32]} radius={0.02} smoothness={1} position={[0, 0.04, -0.08]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.8} />
            </RoundedBox>
            {[-0.42, 0.42].map(x => (
                <mesh key={x} position={[x, 0.34, -0.08]} castShadow>
                    <boxGeometry args={[0.07, 0.6, 0.07]} />
                    <meshStandardMaterial color={PALETTE.leather800} roughness={0.75} />
                </mesh>
            ))}

            {/* Panel frame + corkboard: landscape (2.8 x 1.3), with extra margin below the notes
                rather than above — the notes keep fixed coordinates, so the panel's top edge
                stays level while the bottom margin absorbs the panel's height. Positioned on
                top of the posts (post height + half the panel's height). */}
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
    // The click zone shouldn't be limited to the visible mesh (often thin/small): an
    // invisible but still raycastable cylinder (opacity 0, not visible=false — an invisible
    // object stops being intersected at all) rising from the floor well above the label.
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

            <Html position={[0, LABEL_Y, 0]} center className="pointer-events-none">
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

// Texture generated once (2D canvas, radial gradient) and shared by every smoke wisp,
// rather than one per instance — the real cost of an effect like this usually comes from
// repeated texture generation, not from rendering the handful of sprites themselves.
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

// A few cheap smoke wisps above a fire: sprites (always camera-facing, no custom geometry)
// that rise and fade in a loop. No shadows, no physics, one shared texture — deliberately
// limited to the brazier rather than added to every candle/torch in the room, to keep the cost
// negligible.
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

// Floor and ceiling mist for the room: large, near-transparent flat planes reusing the same
// texture (radial gradient) as the brazier smoke — no extra texture or generation. Very slow
// rotation, no shadows, unlit (meshBasicMaterial, unaffected by scene lights): a cheap ambient
// effect, not a simulation.
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
            // Slow drift (rotation + slight x/z sway) and opacity breathing, phase-shifted per
            // layer: a static mist doesn't read as "alive".
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
            {/* As with the deck-table candle: Candle's base must touch the top of the brazier
                (0.38), not be centered on it (which would float it half above). */}
            <Candle position={[0, 0.38 + 0.275 * 0.55, 0]} scale={0.55} />
            <Smoke position={[0, 0.75, 0]} />
        </group>
    )
}

// A silhouette moth circling a brazier. A subtle, unpredictable living detail — rather than
// static scenery.
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

function HallScene({ hoveredHref, onHoverChange, onArrive }: {
    hoveredHref: string | null
    onHoverChange: (href: string | null) => void
    onArrive: (item: MenuItem) => void
}) {
    // Radius close to the wall, not mid-room: the camera passes through the room's center on
    // its way to each clickable element, so a brazier placed there would sit almost against the
    // lens. Angle -32°: equidistant from Collection (-48°) and Deck (-16°), clear of any
    // approach path.
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
            {/* Brighter still: fog pushed back further, ambient and directional light raised
                further. No camera parallax (removed): the camera stays fixed. */}
            <color attach="background" args={[ATMOSPHERE.background]} />
            <fog attach="fog" args={[ATMOSPHERE.background, 16, 38]} />
            <ambientLight intensity={2.8} color={ATMOSPHERE.ambientColor} />
            <directionalLight position={[2, 6, 3]} intensity={2.1} color="#c9cdd2" castShadow shadow-mapSize={[512, 512]} />
            <Sparkles count={45} scale={[14, 4, 12]} position={[0, 1.8, -4]} size={1.6} speed={0.2} opacity={0.18} color="#8a8478" />
            <Lantern mode="mouse-track" distance={7} spreadX={2.6} spreadY={1.6} lightIntensity={4} lightAngle={0.26} lightDistance={6} />

            {/* Still no solid floor/ceiling plane — just a low mist and a high mist (the same
                cheap textured planes as the brazier smoke) to suggest both without building a
                fully enclosed room. */}
            <RoomMist y={0.12} radius={5} count={3} opacity={0.08} color="#6b7178" />
            <RoomMist y={4.4} facingDown radius={5.5} count={2} opacity={0.06} color="#8a7a63" />

            {/* Ring of bookshelves enclosing the room; the slot at GAME_DOOR_ANGLE is left open
                for the cellar door, rendered by the 'door' Hotspot3D below. The 12 (identical)
                cabinets are one shared instancedMesh; each Bookshelf only layers its shelves
                and books on top. */}
            <BookshelfCaissons shelves={shelfCaissonPlacements} />
            {SHELF_RING_ANGLES.map((angleDeg, i) => {
                const [sx, sz] = polar(angleDeg, RING_RADIUS)
                return <Bookshelf key={i} position={[sx, 0, sz]} rotationY={-(angleDeg * Math.PI) / 180} seed={i + 1} />
            })}
            {/* Bookshelves flush against the door frame, so it actually touches the wall
                instead of floating in a gap. */}
            {DOOR_FLANK_ANGLES.map((angleDeg, i) => {
                const [sx, sz] = polar(angleDeg, RING_RADIUS)
                return <Bookshelf key={`flank-${i}`} position={[sx, 0, sz]} rotationY={-(angleDeg * Math.PI) / 180} seed={100 + i} />
            })}

            {/* Wall torches: a few bookshelves in the ring carry one, for believable light (it
                comes from a visible fixture) rather than just the halo that follows the mouse. */}
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

// three.js's default PerspectiveCamera behavior holds the VERTICAL fov constant and derives the
// horizontal fov from the canvas's aspect ratio — great for a landscape window (wider just shows
// more), bad for a narrow/portrait one: the row of 5 hotspots (Collection...Manual, laid out
// along the horizontal axis) starts losing its edges off-screen. This does the opposite: pick a
// horizontal fov once (backed out from the original fov=56 at a 16:9 reference, so typical desktop
// windows look unchanged) and hold THAT constant, deriving the vertical fov from the current
// aspect instead — a narrow window shows more sky/floor margin instead of cropping the hotspots.
const REFERENCE_ASPECT = 16 / 9
const REFERENCE_VERTICAL_FOV_DEG = 56
const HORIZONTAL_FOV_RAD = 2 * Math.atan(Math.tan((REFERENCE_VERTICAL_FOV_DEG * Math.PI / 180) / 2) * REFERENCE_ASPECT)
// Clamped so extreme aspect ratios (very tall/narrow windows) can't turn the vertical fov into an
// uncomfortable fisheye — beyond this the hotspots crop again, which is the lesser evil.
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

    // The component no longer unmounts when leaving the hub (see HubBackground.tsx): without
    // this reset, arrivingRef stayed stuck at `true` after the very first click for the rest of
    // the session, blocking any further navigation from the hub after the first return.
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
            {/* dpr capped at 1.5 (not 2): on a retina screen, 2x doubles the pixels to compute
                for marginal visual gain — a big perf lever for a busy scene. frameloop="never"
                while the hub is hidden (see HubBackground.tsx, `active`): the Canvas stays
                mounted (WebGL context/geometry never recreated when returning to "/") but its
                render loop actually stops — torches/sparkles/moth don't spin for nothing while
                on another page. */}
            <Canvas shadows="percentage" dpr={[1, 1.5]} gl={{ antialias: true }} frameloop={active ? 'always' : 'never'}>
                {/* With no floor to manage, the camera is simple again: nearly level, looking
                    straight at the row of elements (as sketched) instead of hunting for a pitch
                    that balances a floor that no longer exists. Fov is computed by HubCamera
                    (constant horizontal fov, not three.js's default constant vertical fov) so the
                    row of hotspots stays framed the same regardless of window shape. */}
                <HubCamera />
                {/* TutoBoard loads its textures via useTexture (async, drei): without Suspense
                    here, that load crashes the whole R3F tree (nothing to catch it as a
                    fallback) — the entire scene unmounts, including the Html labels of the
                    other hotspots. */}
                <Suspense fallback={null}>
                    <HallScene hoveredHref={hoveredHref} onHoverChange={setHoveredHref} onArrive={handleArrive} />
                </Suspense>
            </Canvas>

            <div className="pointer-events-none absolute inset-x-0 top-8 z-50 flex justify-center">
                {/* clamp() (not a fixed text-8xl): plain DOM text, not 9-slice art, so it can
                    scale continuously with the window instead of going through ScaleToFit. */}
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
