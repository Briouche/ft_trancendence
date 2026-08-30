'use client'

import { RoundedBox } from '@react-three/drei'
import { PALETTE } from './theme'
import Candle from './Candle'

// Grande porte d'entrée de la bibliothèque — même construction que la porte du sous-sol du hall
// (cadre en pierre, vantail en planches, ferrures, anneau), mais mise à l'échelle pour être le
// sujet central de la scène plutôt qu'un élément parmi d'autres dans l'anneau du hall. Lueur
// chaude et accueillante sous la porte (au lieu de la lueur froide "verrouillé" du sous-sol) :
// c'est la porte qu'on est invité à pousser, pas celle qui reste fermée.
// Dimensionnée pour tenir entière dans le cadrage fixe de RoomCanvas (caméra à [0, 2.4, 6],
// fov 38, visant [0, 1.1, 0]) — une porte plus haute que ~3.2 unités sort du champ par le haut,
// quelle que soit la hauteur de la fenêtre (le FOV vertical ne dépend pas du viewport).
const HALF_WIDTH = 0.75
const DOOR_HEIGHT = 2.55
const FRAME_HEIGHT = DOOR_HEIGHT + 0.4
const LINTEL_Y = FRAME_HEIGHT - 0.16

export default function LibraryDoor() {
    return (
        <group>
            {/* Encadrement en pierre */}
            <RoundedBox args={[0.28, FRAME_HEIGHT, 0.4]} radius={0.03} smoothness={2} position={[-HALF_WIDTH - 0.1, FRAME_HEIGHT / 2, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.ink700} roughness={0.9} />
            </RoundedBox>
            <RoundedBox args={[0.28, FRAME_HEIGHT, 0.4]} radius={0.03} smoothness={2} position={[HALF_WIDTH + 0.1, FRAME_HEIGHT / 2, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.ink700} roughness={0.9} />
            </RoundedBox>
            <RoundedBox args={[(HALF_WIDTH + 0.1) * 2 + 0.28, 0.32, 0.4]} radius={0.03} smoothness={2} position={[0, LINTEL_Y, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.ink700} roughness={0.9} />
            </RoundedBox>

            {/* Vantail en bois massif */}
            <RoundedBox args={[HALF_WIDTH * 2, DOOR_HEIGHT, 0.14]} radius={0.02} smoothness={2} position={[0, DOOR_HEIGHT / 2 + 0.06, 0.06]} castShadow receiveShadow>
                <meshStandardMaterial color={PALETTE.leather900} roughness={0.85} />
            </RoundedBox>
            {/* Planches verticales (joints visibles) */}
            {[-0.45, -0.15, 0.15, 0.45].map(x => (
                <mesh key={x} position={[x, DOOR_HEIGHT / 2 + 0.06, 0.135]}>
                    <boxGeometry args={[0.018, DOOR_HEIGHT - 0.14, 0.01]} />
                    <meshStandardMaterial color={PALETTE.leather700} roughness={0.8} />
                </mesh>
            ))}
            {/* Ferrures horizontales */}
            {[0.4, DOOR_HEIGHT * 0.4, DOOR_HEIGHT - 0.3].map(y => (
                <mesh key={y} position={[0, y, 0.135]} castShadow>
                    <boxGeometry args={[HALF_WIDTH * 2 - 0.08, 0.06, 0.018]} />
                    <meshStandardMaterial color="#1c1d1f" roughness={0.5} metalness={0.5} />
                </mesh>
            ))}
            {/* Anneau et plaque de serrure */}
            <mesh position={[HALF_WIDTH - 0.22, DOOR_HEIGHT / 2 - 0.1, 0.13]}>
                <boxGeometry args={[0.07, 0.1, 0.018]} />
                <meshStandardMaterial color="#1c1d1f" roughness={0.5} metalness={0.5} />
            </mesh>
            <mesh position={[HALF_WIDTH - 0.22, DOOR_HEIGHT / 2 - 0.1, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.065, 0.015, 8, 16]} />
                <meshStandardMaterial color={PALETTE.gold500} metalness={0.6} roughness={0.3} />
            </mesh>

            {/* Lueur chaude qui filtre sous la porte : une invitation, pas un avertissement */}
            <pointLight position={[0, 0.15, 0.35]} color="#ffb066" intensity={1.4} distance={3.5} decay={2} />

            {/* Bougies flanquant la porte, montées sur le cadre en pierre */}
            <Candle position={[-HALF_WIDTH - 0.1, FRAME_HEIGHT * 0.49, 0.32]} scale={0.9} />
            <Candle position={[HALF_WIDTH + 0.1, FRAME_HEIGHT * 0.49, 0.32]} scale={0.9} />
        </group>
    )
}
