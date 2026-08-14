'use client'

import { Sparkles } from '@react-three/drei'
import { ATMOSPHERE } from './theme'

// Ambiance commune à toutes les salles de la bibliothèque : brouillard, pénombre, poussière
// dans la lumière. Reprend les valeurs qui fonctionnaient déjà bien sur BookScene.
export default function Atmosphere() {
    return (
        <>
            <color attach="background" args={[ATMOSPHERE.background]} />
            <fog attach="fog" args={[ATMOSPHERE.background, ATMOSPHERE.fogNear, ATMOSPHERE.fogFar]} />
            <ambientLight intensity={ATMOSPHERE.ambientIntensity} color={ATMOSPHERE.ambientColor} />
            <Sparkles count={35} scale={[9, 4, 9]} size={2} speed={0.2} opacity={0.3} color="#9aa0a6" />
        </>
    )
}
