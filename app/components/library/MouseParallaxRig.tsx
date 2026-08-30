'use client'

import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Léger déplacement de la caméra vers le pointeur, sur toutes les salles : remplace le
// parallax CSS (translate des calques selon la souris) par un vrai mouvement 3D, borné par
// `strength`/`vertical` et lissé (lerp) pour rester confortable. La position/cible de départ
// est capturée au premier frame (pas au montage) pour être sûr que la caméra a déjà sa
// position finale, quel que soit l'ordre de montage par rapport au <PerspectiveCamera>.
export default function MouseParallaxRig({ strength = 0.6, vertical = 0.35 }: { strength?: number; vertical?: number }) {
    const { camera, pointer } = useThree()
    const base = useRef<THREE.Vector3 | null>(null)
    const target = useMemo(() => new THREE.Vector3(), [])
    const smoothed = useRef(new THREE.Vector2(0, 0))

    useFrame(() => {
        if (!base.current) {
            base.current = camera.position.clone()
            const forward = new THREE.Vector3()
            camera.getWorldDirection(forward)
            target.copy(camera.position).addScaledVector(forward, 10)
        }

        smoothed.current.lerp(pointer, 0.06)
        camera.position.set(
            base.current.x + smoothed.current.x * strength,
            base.current.y + smoothed.current.y * strength * vertical,
            base.current.z,
        )
        camera.lookAt(target)
    })

    return null
}
