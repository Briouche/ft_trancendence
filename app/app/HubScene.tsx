'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, RoundedBox, Sparkles, Html } from '@react-three/drei'
import * as THREE from 'three'
import Lantern from '@/components/library/Lantern'
import Candle from '@/components/library/Candle'
import { PALETTE, ATMOSPHERE } from '@/components/library/theme'
import { MENU_ITEMS, type MenuItem } from './menu'
import SimpleMenu from './SimpleMenu'

// Le hall : une vraie salle en three-fiber, fermée par un anneau de bibliothèques. Pas de plan de
// sol visible — juste le mobilier et les portes posés dans le noir/brouillard, comme une rangée
// d'éléments éclairés plutôt qu'une pièce entièrement modélisée. Les 4 portes ne sont pas le même
// socle dupliqué : chacune a son propre mobilier — une pile de livres + une vieille lampe, une
// table avec des cartes éparpillées, le bibliothécaire derrière son comptoir, et la porte du
// sous-sol encastrée dans le mur de bibliothèques comme une vraie grille.

// Grille régulière à 13° d'écart : chaque bibliothèque (19.3° de large au rayon choisi) déborde
// largement sur ses voisines plutôt que de laisser un interstice. L'anneau va de -73° à 83°
// (156°) — nettement plus large que ce que la caméra peut voir même à un FOV large — pour qu'on
// ne puisse jamais apercevoir son extrémité (donc le "vide" derrière) sur les bords de l'écran.
// GAME_DOOR_ANGLE occupe un de ces emplacements (les bibliothèques voisines débordent dedans,
// donc pas de trou même si la porte elle-même est plus étroite).
const RING_RADIUS = 5.6
// La porte du sous-sol occupe un créneau proche du centre (13°), pas pile 0° — pour qu'elle
// s'inscrive dans la même progression que les 3 autres plutôt que de lire comme "LE centre".
// Deux créneaux (0° et 26°) sont laissés libres de part et d'autre pour lui donner de la place —
// mais ça laissait un vrai trou visible (la porte ne touchait plus aucune bibliothèque). Les deux
// angles ci-dessous rajoutent une bibliothèque calée juste contre chaque bord du cadre de la
// porte, en plus de la grille régulière, pour refermer ce trou sans réduire l'espace de la porte.
const GAME_DOOR_ANGLE = 13
const SHELF_RING_ANGLES = [-78, -65, -52, -39, -26, -13, 39, 52, 65, 78]
const DOOR_FLANK_ANGLES = [-7, 33]
// Torches murales, montées sur certaines de ces bibliothèques (pas toutes — juste assez pour
// éclairer la pièce par endroits, sans recréer le lavage uniforme qu'on veut éviter).
const TORCH_ANGLES = [-65, -26, 26, 65]
const TORCH_HEIGHT = 2.15

type Variant = 'books' | 'table' | 'librarian' | 'door'
type Layout = { angleDeg: number; radius: number; variant: Variant }

// Rayons des 3 portes "posées au sol" bien inférieurs à RING_RADIUS : elles doivent rester
// devant le mur de bibliothèques, jamais le traverser. Ordre gauche→droite, espacement régulier
// (~29-32°) : Collection, Deck, Sous-sol, Bibliothécaire — le sous-sol est le 3ème de la
// séquence, pas un élément à part planté au centre de la pièce.
const LAYOUT: Record<string, Layout> = {
    '/collection': { angleDeg: -48, radius: 4.9, variant: 'books' },
    '/deck':       { angleDeg: -16, radius: 5.0, variant: 'table' },
    '/packs':      { angleDeg:  42, radius: 4.3, variant: 'librarian' },
    '/game':       { angleDeg: GAME_DOOR_ANGLE, radius: RING_RADIUS, variant: 'door' },
}

const LABEL_Y: Record<Variant, number> = { books: 1.15, table: 1.5, librarian: 1.72, door: 3.35 }

function polar(angleDeg: number, radius: number): [number, number] {
    const a = (angleDeg * Math.PI) / 180
    return [Math.sin(a) * radius, -Math.cos(a) * radius]
}

// Hash déterministe (pas Math.random) : les rangées de livres et les cartes éparpillées ne
// doivent pas se reconfigurer visuellement à chaque re-render (ex: le survol d'un autre élément
// qui change du state plus haut).
function pseudoRandom(seed: number): number {
    const x = Math.sin(seed * 12.9898) * 43758.5453
    return x - Math.floor(x)
}

const SHELF_ROWS = 5
const BOOKS_PER_ROW = 8

// Une bibliothèque murale : un caisson + des rangées de livres à la largeur/hauteur/teinte/
// inclinaison irrégulières (jamais deux livres identiques). `seed` distingue chaque instance de
// l'anneau — sans lui, toutes les bibliothèques utilisaient le même calcul (row/i) et étaient
// donc des copies visuellement identiques malgré la géométrie procédurale.
//
// Les livres sont un seul <instancedMesh> par bibliothèque (~35 livres en un draw call) plutôt
// que 35 mesh séparés : avec ~12 bibliothèques, ça faisait plus de 400 mesh individuels, chacun
// projetant une ombre — la vraie cause du ralentissement.
function Bookshelf({ position, rotationY = 0, seed = 0 }: { position: [number, number, number]; rotationY?: number; seed?: number }) {
    const shelfColors = [PALETTE.leather700, PALETTE.leather800, PALETTE.ink700, PALETTE.leather900]
    const booksRef = useRef<THREE.InstancedMesh>(null)

    const books = useMemo(() => {
        const list: { x: number; y: number; w: number; h: number; tilt: number; color: string }[] = []
        for (let row = 0; row < SHELF_ROWS; row++) {
            const shelfY = 0.32 + row * 0.58
            // Chaque rangée décale légèrement son point de départ et son nombre de livres :
            // des bords irréguliers, pas une grille parfaite répétée à chaque étagère.
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

    useEffect(() => {
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
            <RoundedBox args={[1.9, 3.3, 0.5]} radius={0.03} smoothness={2} position={[0, 1.65, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.9} />
            </RoundedBox>
            {Array.from({ length: SHELF_ROWS }).map((_, row) => (
                <mesh key={row} position={[0, 0.32 + row * 0.58 - 0.02, 0.1]} receiveShadow>
                    <boxGeometry args={[1.82, 0.04, 0.42]} />
                    <meshStandardMaterial color={PALETTE.leather800} roughness={0.75} />
                </mesh>
            ))}
            <instancedMesh ref={booksRef} args={[undefined, undefined, books.length]} receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial roughness={0.8} />
            </instancedMesh>
        </group>
    )
}

// Une torche murale, montée sur le caisson d'une bibliothèque — une vraie applique plutôt qu'un
// brasero posé au sol : le bras en fer est fixé dans la tranche du caisson, la bougie dépasse à
// peine vers la pièce (une torche, pas un cierge géant). Lumière fixe pour l'instant (le glow
// animé a été retiré à la demande).
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

// Une vieille lampe à huile : base en laiton, globe de verre qui vacille doucement — la source
// de lumière qui éclaire la pile de livres à côté d'elle.
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

// Un petit coffre fermé, posé sur le comptoir du bibliothécaire — pas le grand coffre à paquets
// (déjà utilisé dans VaultRoom), juste un accessoire de comptoir : base + couvercle + fermoir doré.
function TableChest({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <RoundedBox args={[0.32, 0.18, 0.22]} radius={0.02} smoothness={2} position={[0, 0.09, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather800} roughness={0.6} />
            </RoundedBox>
            <RoundedBox args={[0.34, 0.08, 0.24]} radius={0.03} smoothness={2} position={[0, 0.22, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.55} />
            </RoundedBox>
            <mesh position={[0, 0.13, 0.115]}>
                <boxGeometry args={[0.045, 0.055, 0.02]} />
                <meshStandardMaterial color={PALETTE.gold500} metalness={0.6} roughness={0.3} />
            </mesh>
        </group>
    )
}

// Le bibliothécaire : silhouette encapuchonnée derrière son comptoir, sans visage — juste deux
// points de lumière dans l'ombre de la capuche, qui bougent furtivement (petits coups d'oeil,
// pas un balayage régulier) pour donner l'impression que quelqu'un observe vraiment. Une vieille
// lampe et un petit coffre posés sur le comptoir, devant lui.
function Librarian({ locked }: { locked: boolean }) {
    const eyesRef = useRef<THREE.Group>(null)

    useFrame((state, delta) => {
        if (!eyesRef.current) return
        const t = state.clock.getElapsedTime()
        const holdIndex = Math.floor(t / 1.6)
        const targetX = (pseudoRandom(holdIndex * 3.7) - 0.5) * 0.07
        const targetY = (pseudoRandom(holdIndex * 9.1) - 0.5) * 0.02
        eyesRef.current.position.x = THREE.MathUtils.damp(eyesRef.current.position.x, targetX, 14, delta)
        eyesRef.current.position.y = THREE.MathUtils.damp(eyesRef.current.position.y, targetY, 14, delta)
    })

    return (
        <group>
            <RoundedBox args={[1.1, 0.5, 0.55]} radius={0.04} smoothness={3} position={[0, 0.25, 0.48]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather800} roughness={0.6} />
            </RoundedBox>
            <OldLamp position={[-0.32, 0.5, 0.35]} />
            <TableChest position={[0.22, 0.5, 0.5]} />
            <mesh position={[0, 0.78, 0]} castShadow>
                <cylinderGeometry args={[0.2, 0.37, 1.0, 20]} />
                <meshStandardMaterial color={PALETTE.ink900} roughness={0.88} />
            </mesh>
            <mesh position={[0, 1.34, 0.02]} castShadow>
                <sphereGeometry args={[0.22, 18, 18]} />
                <meshStandardMaterial color={PALETTE.ink900} roughness={0.9} />
            </mesh>
            {/* Ombre du visage, plus petite qu'avant : elle cachait les yeux (leur ancienne
                position tombait à l'intérieur de cette sphère, donc invisibles). */}
            <mesh position={[0, 1.29, 0.15]}>
                <sphereGeometry args={[0.1, 14, 14]} />
                <meshStandardMaterial color="#08090a" roughness={1} />
            </mesh>
            {!locked && (
                // Yeux étirés horizontalement (pas des billes rondes) : une fente perçante plutôt
                // qu'un regard doux, plus brillante et plus grande pour rester lisible dans la pénombre.
                <group ref={eyesRef} position={[0, 1.3, 0.31]}>
                    <mesh position={[-0.06, 0, 0]} scale={[1.7, 0.5, 1]}>
                        <sphereGeometry args={[0.036, 12, 10]} />
                        <meshStandardMaterial color={PALETTE.gold400} emissive={PALETTE.gold400} emissiveIntensity={8} toneMapped={false} />
                    </mesh>
                    <mesh position={[0.06, 0, 0]} scale={[1.7, 0.5, 1]}>
                        <sphereGeometry args={[0.036, 12, 10]} />
                        <meshStandardMaterial color={PALETTE.gold400} emissive={PALETTE.gold400} emissiveIntensity={8} toneMapped={false} />
                    </mesh>
                    <pointLight position={[0, 0, 0.05]} color={PALETTE.gold400} intensity={0.8} distance={1.6} decay={2} />
                </group>
            )}
            <pointLight position={[0, 0.6, 0.3]} color={PALETTE.gold500} intensity={0.45} distance={2.8} decay={2} />
        </group>
    )
}

// Un fauteuil de lecture : assise, dossier légèrement incliné en arrière, accoudoirs, pieds fins.
function Armchair() {
    const legs: [number, number][] = [[-0.2, -0.18], [0.2, -0.18], [-0.2, 0.18], [0.2, 0.18]]
    return (
        <group>
            <RoundedBox args={[0.5, 0.14, 0.46]} radius={0.05} smoothness={3} position={[0, 0.28, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather700} roughness={0.75} />
            </RoundedBox>
            <RoundedBox args={[0.5, 0.56, 0.14]} radius={0.06} smoothness={3} position={[0, 0.58, -0.18]} rotation={[-0.14, 0, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather700} roughness={0.75} />
            </RoundedBox>
            {[-1, 1].map(side => (
                <RoundedBox key={side} args={[0.1, 0.22, 0.4]} radius={0.04} smoothness={2} position={[side * 0.26, 0.42, -0.02]} castShadow receiveShadow>
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

// La table de chevet à côté du fauteuil : un petit plateau + un caisson, tenant la lampe et le
// gros livre rouge.
function NightTable({ position }: { position: [number, number, number] }) {
    return (
        <group position={position}>
            <RoundedBox args={[0.28, 0.44, 0.28]} radius={0.02} smoothness={2} position={[0, 0.26, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.7} />
            </RoundedBox>
            <RoundedBox args={[0.34, 0.04, 0.34]} radius={0.015} smoothness={2} position={[0, 0.5, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather800} roughness={0.6} />
            </RoundedBox>
            <mesh position={[0, 0.28, 0.145]}>
                <boxGeometry args={[0.06, 0.01, 0.01]} />
                <meshStandardMaterial color={PALETTE.gold500} metalness={0.5} roughness={0.4} />
            </mesh>
        </group>
    )
}

// Le gros livre rouge, OUVERT et posé sur un petit lutrin (repose-livre) — pour qu'on le
// reconnaisse comme un livre qu'on est en train de lire, pas un simple bloc rouge fermé.
function OpenBookOnStand({ position, rotationY = 0 }: { position: [number, number, number]; rotationY?: number }) {
    return (
        <group position={position} rotation={[0, rotationY, 0]}>
            {/* Socle du lutrin, à plat */}
            <RoundedBox args={[0.3, 0.03, 0.16]} radius={0.012} smoothness={2} position={[0, 0.015, 0.05]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.7} />
            </RoundedBox>
            {/* Plan incliné qui porte le livre, penché comme un vrai lutrin */}
            <group position={[0, 0.03, -0.02]} rotation={[-0.6, 0, 0]}>
                <RoundedBox args={[0.3, 0.02, 0.22]} radius={0.01} smoothness={2} position={[0, 0, 0.11]} castShadow receiveShadow>
                    <meshStandardMaterial color={PALETTE.leather800} roughness={0.7} />
                </RoundedBox>
                {/* Couverture rouge, visible en dessous des pages */}
                <mesh position={[0, 0.014, 0.11]}>
                    <boxGeometry args={[0.28, 0.012, 0.21]} />
                    <meshStandardMaterial color="#7a1c1c" roughness={0.55} />
                </mesh>
                {/* Deux pages ouvertes, légèrement pliées de part et d'autre de la tranche centrale */}
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

// Une lampe sur pied, plus haute qu'une lampe de table — de l'autre côté du fauteuil par rapport
// à la table de chevet, pour équilibrer la composition plutôt que d'empiler les deux du même côté.
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

// La porte "Collection" : un fauteuil de lecture, sa table de chevet avec le livre ouvert d'un
// côté, la lampe sur pied — plus haute — de l'autre côté pour équilibrer la composition.
function CollectionProps() {
    return (
        <group>
            <Armchair />
            <NightTable position={[0.55, 0, 0.1]} />
            <OpenBookOnStand position={[0.55, 0.52, 0.02]} rotationY={0.15} />
            <FloorLamp position={[-0.52, 0, 0.05]} />
        </group>
    )
}

// La table de la porte "Création de deck" : des cartes éparpillées, jamais alignées, posées sur
// une vieille table ronde.
function DeckTable() {
    const cards = useMemo(
        () => Array.from({ length: 6 }).map((_, i) => ({
            x:     (pseudoRandom(i * 4.1) - 0.5) * 0.7,
            z:     (pseudoRandom(i * 8.3) - 0.5) * 0.7,
            rot:   pseudoRandom(i * 15.2) * Math.PI * 2,
            color: [PALETTE.parchment200, PALETTE.parchment100, PALETTE.gold500][i % 3],
        })),
        [],
    )

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
            {cards.map((c, i) => (
                <mesh key={i} position={[c.x, 0.565 + i * 0.002, c.z]} rotation={[-Math.PI / 2, 0, c.rot]} castShadow>
                    <planeGeometry args={[0.17, 0.24]} />
                    <meshStandardMaterial color={c.color} roughness={0.7} side={THREE.DoubleSide} />
                </mesh>
            ))}
            <pointLight position={[0, 0.95, 0]} color={PALETTE.gold400} intensity={0.5} distance={2.5} decay={2} />
        </group>
    )
}

// La porte du sous-sol : une vraie porte en bois massif de bonne taille, encastrée dans le mur de
// bibliothèques — encadrement en pierre, planches verticales, ferrures horizontales, anneau et
// plaque de serrure. Plus une grille de prison : une porte qu'on pourrait pousser.
function CellarDoor() {
    const halfWidth = 0.82
    const doorHeight = 2.8
    // Le cadre est dérivé de doorHeight (pas de valeurs figées) pour ne jamais se retrouver plus
    // bas que le vantail si on retouche la taille de la porte.
    const frameHeight = doorHeight + 0.4
    const lintelY = frameHeight - 0.13
    return (
        <group>
            {/* Encadrement en pierre */}
            <RoundedBox args={[0.22, frameHeight, 0.34]} radius={0.03} smoothness={2} position={[-halfWidth - 0.08, frameHeight / 2, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.ink700} roughness={0.9} />
            </RoundedBox>
            <RoundedBox args={[0.22, frameHeight, 0.34]} radius={0.03} smoothness={2} position={[halfWidth + 0.08, frameHeight / 2, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.ink700} roughness={0.9} />
            </RoundedBox>
            <RoundedBox args={[(halfWidth + 0.08) * 2 + 0.22, 0.26, 0.34]} radius={0.03} smoothness={2} position={[0, lintelY, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.ink700} roughness={0.9} />
            </RoundedBox>

            {/* Vantail en bois massif */}
            <RoundedBox args={[halfWidth * 2, doorHeight, 0.12]} radius={0.02} smoothness={2} position={[0, doorHeight / 2 + 0.05, 0.05]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.85} />
            </RoundedBox>
            {/* Planches verticales (joints visibles) */}
            {[-0.35, -0.12, 0.12, 0.35].map(x => (
                <mesh key={x} position={[x, doorHeight / 2 + 0.05, 0.115]}>
                    <boxGeometry args={[0.015, doorHeight - 0.12, 0.008]} />
                    <meshStandardMaterial color={PALETTE.leather700} roughness={0.8} />
                </mesh>
            ))}
            {/* Ferrures horizontales */}
            {[0.35, 1.1, doorHeight - 0.25].map(y => (
                <mesh key={y} position={[0, y, 0.115]} castShadow>
                    <boxGeometry args={[halfWidth * 2 - 0.06, 0.05, 0.015]} />
                    <meshStandardMaterial color="#1c1d1f" roughness={0.5} metalness={0.5} />
                </mesh>
            ))}
            {/* Anneau et plaque de serrure */}
            <mesh position={[halfWidth - 0.18, doorHeight / 2 - 0.1, 0.11]}>
                <boxGeometry args={[0.06, 0.08, 0.015]} />
                <meshStandardMaterial color="#1c1d1f" roughness={0.5} metalness={0.5} />
            </mesh>
            <mesh position={[halfWidth - 0.18, doorHeight / 2 - 0.1, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.055, 0.013, 8, 16]} />
                <meshStandardMaterial color={PALETTE.gold500} metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Lueur froide qui filtre sous la porte : garde l'idée "sous-sol verrouillé" sans grille de prison */}
            <pointLight position={[0, 0.12, 0.25]} color="#3a4550" intensity={0.5} distance={2} decay={2} />
        </group>
    )
}

function Hotspot3D({ item, layout, hovered, onHoverChange, onArrive }: {
    item:           MenuItem
    layout:         Layout
    hovered:        boolean
    onHoverChange:  (href: string | null) => void
    onArrive:       (item: MenuItem) => void
}) {
    const locked = !item.available
    const groupRef = useRef<THREE.Group>(null)
    const [x, z] = polar(layout.angleDeg, layout.radius)
    const facingRotationY = -(layout.angleDeg * Math.PI) / 180
    // La zone de clic ne doit pas se limiter au maillage visible (souvent fin/petit) : un
    // cylindre invisible mais bien raycastable (opacity 0, pas visible=false — un objet
    // invisible n'est plus intersecté du tout) qui monte du sol jusque bien au-dessus du nom.
    const hitHeight = LABEL_Y[layout.variant] + 0.4
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
            rotation={layout.variant === 'door' ? [0, facingRotationY, 0] : [0, 0, 0]}
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

            <Html position={[0, LABEL_Y[layout.variant], 0]} center style={{ pointerEvents: 'none' }}>
                <div style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div
                        className="font-engraved tracking-wide"
                        style={{
                            fontSize: 20,
                            color: locked ? '#8a8d90' : (hovered ? PALETTE.gold300 : PALETTE.parchment200),
                            textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                        }}
                    >
                        {item.label}
                    </div>
                    {locked && <div className="font-serif text-xs" style={{ color: '#8a8d90' }}>Verrouillé</div>}
                </div>
            </Html>
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
            <Candle position={[0, 0.38, 0]} scale={0.55} />
        </group>
    )
}

function CrateCluster({ position }: { position: [number, number, number] }) {
    return (
        <group position={position} rotation={[0, 0.4, 0]}>
            <RoundedBox args={[0.6, 0.5, 0.6]} radius={0.04} smoothness={3} position={[0, 0.25, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather800} roughness={0.8} />
            </RoundedBox>
            <RoundedBox args={[0.44, 0.4, 0.44]} radius={0.04} smoothness={3} position={[0.35, 0.2, 0.3]} rotation={[0, 0.5, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.8} />
            </RoundedBox>
        </group>
    )
}

// Un papillon en silhouette : tourne autour d'un brasero. Un détail vivant, imprévisible,
// discret — plutôt qu'un décor figé.
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
    hoveredHref:    string | null
    onHoverChange:  (href: string | null) => void
    onArrive:       (item: MenuItem) => void
}) {
    const [baX, baZ] = polar(-20, 3.6)
    const [ccX, ccZ] = polar(-64, 3.2)

    return (
        <>
            {/* Encore plus lumineux : le brouillard recule encore, l'ambiante et la directionnelle
                montent encore. Pas de parallax caméra (retiré) : la caméra reste fixe. */}
            <color attach="background" args={[ATMOSPHERE.background]} />
            <fog attach="fog" args={[ATMOSPHERE.background, 16, 38]} />
            <ambientLight intensity={2.8} color={ATMOSPHERE.ambientColor} />
            <directionalLight position={[2, 6, 3]} intensity={2.1} color="#c9cdd2" castShadow shadow-mapSize={[512, 512]} />
            <Sparkles count={45} scale={[14, 4, 12]} position={[0, 1.8, -4]} size={1.6} speed={0.2} opacity={0.18} color="#8a8478" />
            <Lantern mode="mouse-track" distance={7} spreadX={2.6} spreadY={1.6} lightIntensity={4} lightAngle={0.26} lightDistance={6} />

            {/* Pas de sol : après plusieurs tentatives de réglage de caméra pour équilibrer sa
                visibilité, on retire simplement le problème — juste les meubles/portes dans le noir,
                comme le croquis fourni. Le fond/brouillard fait office d'obscurité sous les objets. */}

            {/* Anneau de bibliothèques qui referme la pièce ; le créneau à GAME_DOOR_ANGLE est
                laissé libre pour la porte du sous-sol, rendue par le Hotspot3D 'door' ci-dessous. */}
            {SHELF_RING_ANGLES.map((angleDeg, i) => {
                const [sx, sz] = polar(angleDeg, RING_RADIUS)
                return <Bookshelf key={i} position={[sx, 0, sz]} rotationY={-(angleDeg * Math.PI) / 180} seed={i + 1} />
            })}
            {/* Bibliothèques calées contre le cadre de la porte, pour qu'elle touche vraiment le
                mur au lieu de flotter dans un trou. */}
            {DOOR_FLANK_ANGLES.map((angleDeg, i) => {
                const [sx, sz] = polar(angleDeg, RING_RADIUS)
                return <Bookshelf key={`flank-${i}`} position={[sx, 0, sz]} rotationY={-(angleDeg * Math.PI) / 180} seed={100 + i} />
            })}

            {/* Torches murales : quelques bibliothèques de l'anneau en portent une, pour une
                lumière crédible (elle vient d'une applique visible) plutôt que du seul halo qui
                suit la souris. */}
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
            <CrateCluster position={[ccX, 0, ccZ]} />
            <Moth center={[baX, 0.9, baZ]} />
        </>
    )
}

export default function HubScene() {
    const router = useRouter()
    const [transitioning, setTransitioning] = useState(false)
    const [simpleMenu, setSimpleMenu] = useState(false)
    const [hoveredHref, setHoveredHref] = useState<string | null>(null)
    const arrivingRef = useRef(false)

    function handleArrive(item: MenuItem) {
        if (arrivingRef.current) return
        arrivingRef.current = true
        setTransitioning(true)
        setTimeout(() => router.push(item.href), 380)
    }

    if (simpleMenu) return <SimpleMenu onWantHub={() => setSimpleMenu(false)} />

    const locked = hoveredHref !== null && !MENU_ITEMS.find(i => i.href === hoveredHref)?.available

    return (
        <div
            className="relative h-screen w-full select-none overflow-hidden"
            style={{ background: PALETTE.ink950, cursor: hoveredHref ? (locked ? 'not-allowed' : 'pointer') : 'default' }}
        >
            {/* dpr plafonné à 1.5 (pas 2) : sur un écran retina, 2x double le nombre de pixels à
                calculer pour un gain visuel marginal — gros levier de perf pour une scène chargée. */}
            <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
                {/* Sans sol à gérer, la caméra redevient simple : quasiment de niveau, elle regarde
                    droit vers la rangée des 4 éléments (comme le croquis) plutôt que de chercher un
                    pitch qui équilibre un sol qui n'existe plus. */}
                <PerspectiveCamera makeDefault position={[0, 1.75, 3.0]} fov={56} onUpdate={c => c.lookAt(0, 1.6, -2.4)} />
                <HallScene hoveredHref={hoveredHref} onHoverChange={setHoveredHref} onArrive={handleArrive} />
            </Canvas>

            <div className="pointer-events-none absolute inset-x-0 top-8 z-50 flex justify-center">
                <h1 className="font-engraved tracking-wide" style={{ fontSize: 38, color: PALETTE.parchment200, textShadow: '0 3px 10px rgba(0,0,0,0.9)' }}>
                    ft_transcendence
                </h1>
            </div>

            {!transitioning && (
                <div className="pointer-events-none absolute inset-x-0 bottom-5 z-50 flex justify-center">
                    <p className="rounded-full bg-ink-950/70 px-4 py-2 font-serif text-sm text-parchment-300/70">
                        Déplace la souris pour explorer · clique sur un élément pour t&apos;y rendre
                    </p>
                </div>
            )}

            <button
                onClick={() => setSimpleMenu(true)}
                className="pointer-events-auto absolute right-4 top-4 z-50 rounded-lg border border-white/15 bg-ink-900/80
                    px-3 py-1.5 font-serif text-xs text-parchment-300/70 transition-colors hover:bg-ink-800"
            >
                ☰ Menu simple
            </button>
        </div>
    )
}
