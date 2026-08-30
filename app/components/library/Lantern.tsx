'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { LANTERN } from './theme'

type Props = (
    // Accrochée à la caméra : utilisée dans le hall en FPS, où la souris EST la direction du
    // regard (pointer lock) — la lanterne suit donc le regard sans calcul supplémentaire.
    | { mode: 'attached' }
    // Suit la souris à travers le cadre de la caméra, sur un plan perpendiculaire à son axe
    // de vue (et non le sol) : reste stable et couvre tout l'écran quel que soit l'angle de
    // la caméra — une projection sur le sol devient dégénérée dès que la caméra vise à
    // l'horizontale (le rayon ne croise plus jamais le plan y=0 dans la moitié haute de l'écran).
    | { mode: 'mouse-track'; distance?: number; spreadX?: number; spreadY?: number }
) & {
    // Surcharges optionnelles du faisceau (par défaut les constantes LANTERN) : une pièce plus
    // large qu'une salle de table (le hall) a besoin d'un faisceau plus étroit/moins intense
    // pour rester une flaque de lumière crédible plutôt qu'un lavage general du sol.
    lightIntensity?: number
    lightAngle?:     number
    lightDistance?:  number
}

// La lanterne : unique source de lumière chaude et mobile de chaque scène, tout le reste
// n'étant éclairé qu'en pénombre par l'ambient light d'Atmosphere.
export default function Lantern(props: Props) {
    const { lightIntensity = LANTERN.intensity, lightAngle = LANTERN.angle, lightDistance = LANTERN.distance } = props
    const lightRef = useRef<THREE.SpotLight>(null)
    const target = useMemo(() => new THREE.Object3D(), [])
    const { camera, pointer } = useThree()

    useEffect(() => {
        if (lightRef.current) lightRef.current.target = target
    }, [target])

    useFrame(() => {
        if (!lightRef.current) return
        lightRef.current.position.copy(camera.position)

        const forward = new THREE.Vector3()
        camera.getWorldDirection(forward)

        if (props.mode === 'attached') {
            target.position.copy(camera.position).addScaledVector(forward, 6)
            return
        }

        const { distance = 9, spreadX = 7, spreadY = 4 } = props
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()
        const up = new THREE.Vector3().crossVectors(right, forward).normalize()

        target.position
            .copy(camera.position)
            .addScaledVector(forward, distance)
            .addScaledVector(right, pointer.x * spreadX)
            .addScaledVector(up, pointer.y * spreadY)
    })

    return (
        <>
            <spotLight
                ref={lightRef}
                color={LANTERN.color}
                intensity={lightIntensity}
                distance={lightDistance}
                angle={lightAngle}
                penumbra={LANTERN.penumbra}
                decay={LANTERN.decay}
                castShadow
            />
            <primitive object={target} />
        </>
    )
}
