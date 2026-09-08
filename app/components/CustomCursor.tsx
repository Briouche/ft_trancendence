'use client'

import { useEffect, useRef, useState } from 'react'

// Arrow tip within each sprite (measured pixel-precise, at the file's native scale —
// DISPLAY_SCALE corrects it afterwards): it's this point, not the image's corner, that must
// coincide with the mouse's actual position.
const DEFAULT_TIP = { x: 4, y: 0 }
const CLICK_TIP    = { x: 16, y: 16 }
const CLICK_FRAME_MS = 45

// Sprites displayed at roughly half their native size (already upscaled ×4 from the pixel-art
// source): a more discreet cursor. The tip offsets above are scaled at the same time, otherwise
// the arrow tip drifts away from the mouse's actual position.
const DISPLAY_SCALE = 0.6

type Frame = 'default' | 1 | 2 | 3 | 4

// Replaces the native cursor with the one from the "Complete UI Book Styles Pack" (Crusenho),
// with a small click animation (4 frames) — impossible with `cursor: url()` alone, which only
// accepts a static image, hence this component: a manually positioned <img> that follows the mouse.
export default function CustomCursor() {
    const imgRef = useRef<HTMLImageElement>(null)
    const [frame, setFrame] = useState<Frame>('default')
    const revealed = useRef(false)
    // Last known mouse position: a click without moving the mouse fires no "mousemove" at all,
    // so reposition() needs a position to reuse outside of that event.
    const lastMouse = useRef({ x: 0, y: 0 })

    // scale() after translate(): with transform-origin at 0 0 (top-left), the tip offset stays
    // correct under the mouse regardless of scale. Kept outside the mousemove effect so the
    // click animation can also reposition itself directly on each frame change, rather than
    // waiting on the next mousemove to correct its position.
    function reposition(clientX: number, clientY: number, currentFrame: Frame) {
        const el = imgRef.current
        if (!el) return
        const tip = currentFrame === 'default' ? DEFAULT_TIP : CLICK_TIP
        const x = clientX - tip.x * DISPLAY_SCALE
        const y = clientY - tip.y * DISPLAY_SCALE
        el.style.transform = `translate(${x}px, ${y}px) scale(${DISPLAY_SCALE})`
    }

    useEffect(() => {
        function onMove(e: MouseEvent) {
            lastMouse.current = { x: e.clientX, y: e.clientY }
            const el = imgRef.current
            if (el && !revealed.current) {
                revealed.current = true
                el.style.opacity = '1'
            }
            reposition(e.clientX, e.clientY, frame)
        }
        window.addEventListener('mousemove', onMove)
        return () => window.removeEventListener('mousemove', onMove)
    }, [frame])

    useEffect(() => {
        function onDown() {
            let i = 1
            setFrame(i as Frame)
            reposition(lastMouse.current.x, lastMouse.current.y, i as Frame)
            const interval = setInterval(() => {
                i += 1
                if (i > 4) {
                    clearInterval(interval)
                    setFrame('default')
                    reposition(lastMouse.current.x, lastMouse.current.y, 'default')
                    return
                }
                setFrame(i as Frame)
                reposition(lastMouse.current.x, lastMouse.current.y, i as Frame)
            }, CLICK_FRAME_MS)
        }
        window.addEventListener('mousedown', onDown)
        return () => window.removeEventListener('mousedown', onDown)
    }, [])

    const src = frame === 'default'
        ? '/textures/book/cursor/default.webp'
        : `/textures/book/cursor/click-${frame}.webp`

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
