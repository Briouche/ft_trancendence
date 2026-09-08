'use client'

import { useEffect, useRef, useState } from 'react'

// Same idea as ScaledCardFace (see that file): the content (the book, the banner...) keeps its
// "design" dimensions in fixed pixels — never touched, so all the notebook art's pixel-perfect
// alignment stays valid — and a single transform scale, measured against its natural size
// (ResizeObserver, unaffected by the transform we apply ourselves) relative to the window, is
// what makes it fit any screen size (portrait 1080×1920 included).
export default function ScaleToFit({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const innerRef = useRef<HTMLDivElement>(null)
    const naturalSize = useRef({ width: 0, height: 0 })
    const [scale, setScale] = useState(0)

    useEffect(() => {
        const inner = innerRef.current
        if (!inner) return

        const recompute = () => {
            const { width, height } = naturalSize.current
            if (!width || !height) return
            setScale(Math.min(1, window.innerWidth / width, window.innerHeight / height))
        }

        const observer = new ResizeObserver(([entry]) => {
            naturalSize.current = { width: entry.contentRect.width, height: entry.contentRect.height }
            recompute()
        })
        observer.observe(inner)

        window.addEventListener('resize', recompute)
        return () => {
            observer.disconnect()
            window.removeEventListener('resize', recompute)
        }
    }, [])

    return (
        <div className={`flex h-screen w-full items-center justify-center overflow-hidden ${className}`}>
            <div ref={innerRef} style={{ transform: `scale(${scale})` }}>
                {children}
            </div>
        </div>
    )
}
