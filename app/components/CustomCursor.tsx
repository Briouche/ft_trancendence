'use client'

import { useEffect, useRef, useState } from 'react'

// Pointe de la flèche dans chaque sprite (mesurée au pixel près, à l'échelle native du fichier
// — DISPLAY_SCALE la corrige ensuite) : c'est ce point-là, pas le coin de l'image, qui doit
// coïncider avec la position réelle de la souris.
const DEFAULT_TIP = { x: 4, y: 0 }
const CLICK_TIP    = { x: 16, y: 16 }
const CLICK_FRAME_MS = 45

// Sprites affichés à moitié de leur taille native (déjà upscalée ×4 depuis la source pixel-art) :
// un curseur plus discret. Les offsets de pointe ci-dessus sont mis à l'échelle en même temps,
// sinon la pointe de la flèche se déconnecte de la position réelle de la souris.
const DISPLAY_SCALE = 0.6

type Frame = 'default' | 1 | 2 | 3 | 4

// Remplace le curseur natif par celui du "Complete UI Book Styles Pack" (Crusenho), avec une
// petite animation au clic (4 frames) — impossible avec `cursor: url()` seul, qui n'accepte
// qu'une image statique, d'où ce composant : un <img> positionné à la main qui suit la souris.
export default function CustomCursor() {
    const imgRef = useRef<HTMLImageElement>(null)
    const [frame, setFrame] = useState<Frame>('default')
    const revealed = useRef(false)

    useEffect(() => {
        function onMove(e: MouseEvent) {
            const el = imgRef.current
            if (!el) return
            if (!revealed.current) {
                revealed.current = true
                el.style.opacity = '1'
            }
            const tip = frame === 'default' ? DEFAULT_TIP : CLICK_TIP
            const x = e.clientX - tip.x * DISPLAY_SCALE
            const y = e.clientY - tip.y * DISPLAY_SCALE
            // scale() après translate() : avec transform-origin à 0 0 (top-left), le point de
            // la pointe (déjà compensé ci-dessus) reste sous la souris quelle que soit l'échelle.
            el.style.transform = `translate(${x}px, ${y}px) scale(${DISPLAY_SCALE})`
        }
        window.addEventListener('mousemove', onMove)
        return () => window.removeEventListener('mousemove', onMove)
    }, [frame])

    useEffect(() => {
        function onDown() {
            let i = 1
            setFrame(i as Frame)
            const interval = setInterval(() => {
                i += 1
                if (i > 4) {
                    clearInterval(interval)
                    setFrame('default')
                    return
                }
                setFrame(i as Frame)
            }, CLICK_FRAME_MS)
        }
        window.addEventListener('mousedown', onDown)
        return () => window.removeEventListener('mousedown', onDown)
    }, [])

    const src = frame === 'default'
        ? '/textures/book/cursor/default.png'
        : `/textures/book/cursor/click-${frame}.png`

    return (
        <img
            ref={imgRef}
            src={src}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none fixed left-0 top-0 z-[9999] select-none opacity-0 transition-opacity duration-150"
            style={{ imageRendering: 'pixelated', willChange: 'transform', transformOrigin: '0 0' }}
        />
    )
}
