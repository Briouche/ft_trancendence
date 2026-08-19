'use client'

import { type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import Atmosphere from './Atmosphere'
import Lantern from './Lantern'
import MouseParallaxRig from './MouseParallaxRig'
import { PALETTE } from './theme'

// Plateau commun à toutes les salles "de table" (atelier du Scribe, coffre...) : même
// caméra/ambiance/lanterne que la Collection (BookScene), pour que chaque salle se lise comme
// le même lieu. Les props 3D spécifiques à une salle sont passées en children.
export default function RoomCanvas({ children, parallax = true }: { children?: ReactNode; parallax?: boolean }) {
    return (
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
            <PerspectiveCamera makeDefault position={[0, 2.4, 6]} fov={38} onUpdate={c => c.lookAt(0, 1.1, 0)} />
            <Atmosphere />
            <Lantern mode="mouse-track" distance={7} spreadX={3} spreadY={1.8} />
            {parallax && <MouseParallaxRig strength={0.5} vertical={0.3} />}

            <directionalLight position={[3, 6, 4]} intensity={0.9} color="#fff2df" castShadow shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-4, 3, -3]} intensity={0.25} color="#8fb8ff" />

            {/* Sol : un disque plutôt qu'un plan rectangulaire, pour ne pas finir sur une arête franche */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[16, 64]} />
                <meshStandardMaterial color={PALETTE.ink800} roughness={0.6} metalness={0.15} />
            </mesh>

            {children}
        </Canvas>
    )
}
