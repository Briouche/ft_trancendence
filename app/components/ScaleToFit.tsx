'use client'

import { useEffect, useRef, useState } from 'react'

// Same idea as ScaledCardFace (see that file): the content (the book, the banner...) keeps its
// "design" dimensions in fixed pixels — never touched, so all the notebook art's pixel-perfect
// alignment stays valid — and a single transform scale, measured against its natural size
// (ResizeObserver, unaffected by the transform we apply ourselves) relative to the space actually
// available, is what makes it fill any screen size (portrait 1080×1920 included) while staying
// readable — scaling up on large windows too, not just down on small ones.
//
// Scale is measured against the outer wrapper's own box (a second ResizeObserver), not
// window.innerWidth/innerHeight: callers that aren't full-viewport (e.g. an auth form sharing the
// page with a Header/Footer, via className="h-full" instead of the default h-screen) need the
// scale computed from the space they actually have, not the whole window.
//
// maxScale caps how far content can grow past its own design size. Fine to leave unbounded (the
// default) for content designed to fill the whole viewport (the Collection/Deck Builder "book",
// sized close to a full window already) — but a compact design (e.g. Pack Opening's title + a
// couple of buttons, nowhere near viewport-sized) would otherwise get blown up to cover the whole
// screen, ballooning its text/buttons far past a comfortable reading size on a large monitor.
export default function ScaleToFit({ children, className = 'h-screen', maxScale = Infinity, align = 'center' }: {
    children: React.ReactNode
    className?: string
    maxScale?: number
    // 'start' pins content flush to the top of the container instead of vertically centering it.
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
            {/* transformOrigin follows align: with items-start, the flex box already pins the
                element's (unscaled) top edge to the container's top — origin "top" then makes
                the scale grow downward from that same edge instead of the default center-out
                growth, which would push the scaled-up top back above the container and clip it. */}
            <div ref={innerRef} style={{ transform: `scale(${scale})`, transformOrigin: align === 'start' ? 'top' : 'center' }}>
                {children}
            </div>
        </div>
    )
}
