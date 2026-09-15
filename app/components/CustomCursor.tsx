'use client'

import { useEffect, useRef, useState } from 'react'

// Arrow tip position inside each sprite, at native scale.
const DEFAULT_TIP = { x: 4, y: 0 }
const CLICK_TIP    = { x: 16, y: 16 }
const CLICK_FRAME_MS = 45
const DISPLAY_SCALE = 0.6

type Frame = 'default' | 1 | 2 | 3 | 4

// Sprite cursor following the mouse, with a 4-frame click animation.
export default function CustomCursor() {
    const imgRef = useRef<HTMLImageElement>(null)
    const [frame, setFrame] = useState<Frame>('default')
    const revealed = useRef(false)
    const lastMouse = useRef({ x: 0, y: 0 })

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
