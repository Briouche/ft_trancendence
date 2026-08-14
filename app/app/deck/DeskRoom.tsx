'use client'

import { type ReactNode } from 'react'
import { RoundedBox } from '@react-three/drei'
import RoomFrame from '@/components/library/RoomFrame'
import Candle from '@/components/library/Candle'
import { PALETTE } from '@/components/library/theme'

const DESK_TOP_Y = 0.85
const DESK_SURFACE_Y = DESK_TOP_Y + 0.07

// Un livre : coins arrondis plutôt qu'une simple boxGeometry, pour garder la même "matière"
// organique que le reste de la bibliothèque (BookScene) sur un objet posé, pas seulement sur
// les sources lumineuses.
function Book({ position, rotation, color }: { position: [number, number, number]; rotation: number; color: string }) {
    return (
        <RoundedBox
            args={[0.62, 0.1, 0.44]} radius={0.03} smoothness={4}
            position={position} rotation={[0, rotation, 0]} castShadow receiveShadow
        >
            <meshStandardMaterial color={color} roughness={0.75} />
        </RoundedBox>
    )
}

function BookStack({ position, tilt = 0 }: { position: [number, number, number]; tilt?: number }) {
    const colors = [PALETTE.leather700, PALETTE.leather900, PALETTE.gold600]
    return (
        <group position={position} rotation={[0, tilt, 0]}>
            {colors.map((color, i) => (
                <Book key={i} position={[0, 0.05 + i * 0.105, 0]} rotation={(i - 1) * 0.07} color={color} />
            ))}
        </group>
    )
}

function Desk() {
    const legPositions: [number, number][] = [[-1.6, -0.7], [1.6, -0.7], [-1.6, 0.7], [1.6, 0.7]]
    return (
        <group>
            <RoundedBox args={[3.6, 0.14, 1.7]} radius={0.05} smoothness={4} position={[0, DESK_TOP_Y, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather800} roughness={0.55} />
            </RoundedBox>
            {legPositions.map(([x, z], i) => (
                <mesh key={i} position={[x, 0.39, z]} castShadow>
                    <cylinderGeometry args={[0.07, 0.09, 0.78, 12]} />
                    <meshStandardMaterial color={PALETTE.leather900} roughness={0.6} />
                </mesh>
            ))}
        </group>
    )
}

// Décor 3D de l'atelier du scribe : un bureau, des piles de reliures en cuir et une bougie,
// posés en arrière-plan derrière l'UI (panneaux de cartes + deck) qui reste en HTML classique.
export default function DeskRoom({ children }: { children: ReactNode }) {
    return (
        <RoomFrame
            decor={
                <group position={[0, 0, 1.2]}>
                    <Desk />
                    <BookStack position={[-1.2, DESK_SURFACE_Y, -0.3]} tilt={-0.25} />
                    <BookStack position={[1.15, DESK_SURFACE_Y, 0.15]} tilt={0.18} />
                    <BookStack position={[1.45, DESK_SURFACE_Y, -0.45]} tilt={-0.08} />
                    <Candle position={[-0.1, DESK_SURFACE_Y + 0.28, -0.5]} />
                </group>
            }
        >
            {children}
        </RoomFrame>
    )
}
