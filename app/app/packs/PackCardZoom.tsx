'use client'

import { useEffect, useRef, useState } from 'react'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'

// Close-up of a revealed pack card with a mouse-following tilt; closes on click outside or Escape.
export default function PackCardZoom({
    card, onClose,
}: {
    card:    CardFaceData | null
    onClose: () => void
}) {
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
            className="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-ink-950/70 backdrop-blur-lg"
            onClick={onClose}
        >
            <div
                ref={cardRef}
                onClick={e => e.stopPropagation()}
                className="w-75 transition-transform duration-150 ease-out will-change-transform"
                style={{
                    transform: `perspective(900px) rotateY(${tilt.x * 10}deg) rotateX(${-tilt.y * 10}deg) scale(1.04)`,
                }}
            >
                <ScaledCardFace card={card} />
            </div>

            {card.artist && (
                <p className="font-serif text-2xl italic text-parchment-300/70">{card.artist}</p>
            )}

            <p className="font-serif text-sm italic text-parchment-300/50">Click outside to close</p>
        </div>
    )
}
