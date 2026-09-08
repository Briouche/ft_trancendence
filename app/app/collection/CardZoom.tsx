'use client'

import { useEffect, useRef, useState } from 'react'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'

type Card = CardFaceData & { ownedQty: number }

// Full-screen card zoom, rendered in flat DOM (not the 3D scene): much sharper, and avoids
// redoing the camera/distanceFactor calibration that already caused headaches on the book side.
// The slight mouse-following tilt (parallax) is a plain CSS transform eased by a transition
// rather than a real spring — good enough for the effect wanted here.
export default function CardZoom({ card, onClose }: { card: Card | null; onClose: () => void }) {
    const [tilt, setTilt] = useState({ x: 0, y: 0 })
    const cardRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!card) return

        function onMove(e: MouseEvent) {
            const el = cardRef.current
            if (!el) return
            const rect = el.getBoundingClientRect()
            const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)
            const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)
            setTilt({
                x: Math.max(-1, Math.min(1, dx)),
                y: Math.max(-1, Math.min(1, dy)),
            })
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose()
        }

        window.addEventListener('mousemove', onMove)
        window.addEventListener('keydown', onKey)
        return () => {
            window.removeEventListener('mousemove', onMove)
            window.removeEventListener('keydown', onKey)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [card])

    if (!card) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div className="flex flex-col items-center gap-10">
                <div
                    ref={cardRef}
                    onClick={e => e.stopPropagation()}
                    className="w-[340px] transition-transform duration-150 ease-out will-change-transform"
                    style={{
                        transform: `perspective(900px) rotateY(${tilt.x * 12}deg) rotateX(${-tilt.y * 12}deg) scale(1.04)`,
                    }}
                >
                    {/* stackQty=1: the zoom always shows a single card (with its xN badge),
                        not the two-layer stack effect used in the Collection grid. */}
                    <ScaledCardFace card={card} ownedQty={card.ownedQty} stackQty={1} />
                </div>

                {/* Illustrator signature, below the card (not over its artwork) — absent until
                    `artist` is set for this card (see tcg-collection.json). */}
                {card.artist && (
                    <p className="font-serif text-2xl italic text-parchment-300/70">{card.artist}</p>
                )}
            </div>
        </div>
    )
}
