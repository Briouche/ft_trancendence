'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Bougie partagée par toutes les salles : même flamme qui vacille (scale bruité en boucle)
// et même pointLight chaude, pour que chaque source de lumière ponctuelle de la bibliothèque
// se ressemble. `scale` permet de la réutiliser pour une torche murale plus large.
export default function Candle({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
    const flameRef = useRef<THREE.Mesh>(null)

    useFrame(({ clock }) => {
        if (!flameRef.current) return
        const t = clock.getElapsedTime()
        flameRef.current.scale.setScalar(1 + Math.sin(t * 9) * 0.08 + Math.sin(t * 17) * 0.04)
    })

    return (
        <group position={position} scale={scale}>
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
