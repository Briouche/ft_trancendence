'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { LANTERN } from './theme'

type Props = (
    // Attached to the camera: used in the FPS hall, where the mouse IS the look direction
    // (pointer lock) — so the lantern follows the gaze with no extra computation.
    | { mode: 'attached' }
    // Follows the mouse across the camera's frame, on a plane perpendicular to its view axis
    // (not the floor): stays stable and covers the whole screen regardless of camera angle — a
    // floor projection becomes degenerate as soon as the camera looks toward the horizon (the
    // ray never crosses the y=0 plane anymore in the upper half of the screen).
    | { mode: 'mouse-track'; distance?: number; spreadX?: number; spreadY?: number }
) & {
    // Optional beam overrides (defaulting to the LANTERN constants): a room wider than a table
    // room (the hall) needs a narrower/dimmer beam to stay a believable pool of light rather than
    // a general floor wash.
    lightIntensity?: number
    lightAngle?:     number
    lightDistance?:  number
}

// The lantern: each scene's single warm, moving light source — everything else is only lit in
// dim ambient light from Atmosphere.
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
