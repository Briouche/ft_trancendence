'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { LANTERN } from './theme'

type Props = (
    // 'attached': aims straight ahead of the camera. 'mouse-track': aims where the mouse points,
    // on a plane facing the camera.
    | { mode: 'attached' }
    | { mode: 'mouse-track'; distance?: number; spreadX?: number; spreadY?: number }
) & {
    lightIntensity?: number
    lightAngle?:     number
    lightDistance?:  number
}

/** The scene's single moving warm spotlight, carried by the camera. */
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
