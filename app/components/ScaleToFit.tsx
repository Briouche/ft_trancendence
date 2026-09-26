'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Renders fixed-size content and scales it as one block to fit the available space
 * (up to `maxScale`), so pixel-perfect layouts work at any viewport size.
 */
export default function ScaleToFit({ children, className = 'h-screen', maxScale = Infinity, align = 'center' }: {
    children: React.ReactNode
    className?: string
    maxScale?: number
    align?: 'center' | 'start'
}) {
    const outerRef = useRef<HTMLDivElement>(null)
    const innerRef = useRef<HTMLDivElement>(null)
    const naturalSize = useRef({ width: 0, height: 0 })
    const containerSize = useRef({ width: 0, height: 0 })
    const [scale, setScale] = useState(0)

    useEffect(() => {
        const outer = outerRef.current
        const inner = innerRef.current
        if (!outer || !inner) return

        const recompute = () => {
            const { width, height } = naturalSize.current
            const { width: cw, height: ch } = containerSize.current
            if (!width || !height || !cw || !ch) return
            setScale(Math.min(maxScale, cw / width, ch / height))
        }

        const innerObserver = new ResizeObserver(([entry]) => {
            naturalSize.current = { width: entry.contentRect.width, height: entry.contentRect.height }
            recompute()
        })
        innerObserver.observe(inner)

        const outerObserver = new ResizeObserver(([entry]) => {
            containerSize.current = { width: entry.contentRect.width, height: entry.contentRect.height }
            recompute()
        })
        outerObserver.observe(outer)

        return () => {
            innerObserver.disconnect()
            outerObserver.disconnect()
        }
    }, [maxScale])

    return (
        <div ref={outerRef} className={`flex w-full justify-center overflow-hidden ${align === 'start' ? 'items-start' : 'items-center'} ${className}`}>
            <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: align === 'start' ? 'top' : 'center' }}>
                {children}
            </div>
        </div>
    )
}
