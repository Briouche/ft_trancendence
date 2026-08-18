'use client'

import { useEffect, useRef, useState } from 'react'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'

// Grand plan d'une carte du paquet, avec la même bascule qui suit la souris (parallaxe) que le
// zoom de la Collection — sauf qu'ici la carte part dos tourné : cliquer dessus joue le
// retournement (comme avant dans le damier), un par un, plutôt que de tout révéler d'un coup.
export default function PackCardZoom({
    card, revealed, onReveal, onClose,
}: {
    card:     CardFaceData | null
    revealed: boolean
    onReveal: () => void
    onClose:  () => void
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
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-ink-950/85 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                ref={cardRef}
                onClick={e => { e.stopPropagation(); if (!revealed) onReveal() }}
                className="w-[300px] [perspective:1200px]"
                style={{
                    transform: `perspective(900px) rotateY(${tilt.x * 10}deg) rotateX(${-tilt.y * 10}deg)`,
                }}
            >
                <div
                    className={`relative aspect-[3/4] w-full transition-transform duration-700 [transform-style:preserve-3d]
                        ${revealed ? '[transform:rotateY(180deg)]' : 'cursor-pointer'}`}
                >
                    {/* Dos de la carte : sceau de cire sur cuir */}
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg border-[3px]
                        border-gold-500/60 bg-gradient-to-br from-leather-800 to-ink-900 shadow-2xl [backface-visibility:hidden]">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold-400/70 bg-leather-900/60">
                            <span className="font-display text-2xl text-gold-400/90">✦</span>
                        </div>
                    </div>

                    {/* Face de la carte */}
                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <div className={revealed ? 'animate-card-pop h-full' : 'h-full'}>
                            <ScaledCardFace card={card} />
                        </div>
                    </div>
                </div>
            </div>

            <p className="font-serif text-sm italic text-parchment-300/50">
                {revealed ? 'Click outside to close' : 'Tap the card to reveal it'}
            </p>
        </div>
    )
}
