'use client'

import { useEffect, useRef, useState } from 'react'
import CardFace, { type CardFaceData } from './CardFace'

// CardFace's "design" width: its font sizes (emoji, description, stats...) are fixed and
// calibrated for display at roughly this size (the Collection grid's). Rendering it smaller than
// its natural width breaks the layout (description text running out of room, disproportionate
// emoji) — so instead of constraining it directly inside a narrow grid cell, it's rendered at its
// natural size and the whole thing is then shrunk with a single transform scale measured against
// the actual available width.
const NATURAL_WIDTH = 400

function CardFaceLayer({ card, ownedQty }: { card: CardFaceData; ownedQty?: number }) {
    const outerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(0)

    useEffect(() => {
        const el = outerRef.current
        if (!el) return
        const observer = new ResizeObserver(([entry]) => {
            setScale(entry.contentRect.width / NATURAL_WIDTH)
        })
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return (
        <div ref={outerRef} className="aspect-[130/191] w-full overflow-hidden">
            <div style={{ width: NATURAL_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <CardFace card={card} ownedQty={ownedQty} />
            </div>
        </div>
    )
}

// `stackQty` only drives the stack effect (a second card glued behind, offset to the left) —
// kept separate from `ownedQty` (which drives the "x2" badge drawn by CardFace) because the Deck
// Builder doesn't need that badge (it dims the layers themselves instead, see `dimFront`/
// `dimBack`). `stackQty` defaults to `ownedQty` for the Collection, which only needs one of the
// two props.
//
// `dimFront`/`dimBack`: adding one copy to the deck dims the back card first (immediate visual
// feedback on the first click), a second addition also dims the front one (last copy left, none
// available anymore).
export default function ScaledCardFace({ card, ownedQty, stackQty, dimFront, dimBack }: {
    card: CardFaceData
    ownedQty?: number
    stackQty?: number
    dimFront?: boolean
    dimBack?: boolean
}) {
    const stacked = (stackQty ?? ownedQty ?? 0) > 1

    return (
        <div className="relative w-full">
            {stacked && (
                <div
                    className={`pointer-events-none absolute -left-2 top-1 w-full ${dimBack ? 'grayscale brightness-50' : ''}`}
                    aria-hidden="true"
                >
                    <CardFaceLayer card={card} />
                </div>
            )}
            <div className={`relative ${dimFront ? 'grayscale brightness-50' : ''}`}>
                <CardFaceLayer card={card} ownedQty={ownedQty} />
            </div>
        </div>
    )
}
