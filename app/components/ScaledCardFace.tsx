'use client'

import { useEffect, useRef, useState } from 'react'
import CardFace, { type CardFaceData } from './CardFace'

// Width CardFace's fixed font sizes are calibrated for.
const NATURAL_WIDTH = 400

// Renders CardFace at its natural width, then scales it down to the container's width.
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

/**
 * Card sized to its container; `stackQty` > 1 draws a second copy behind it, `dimFront`/`dimBack`
 * gray out each layer.
 */
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
