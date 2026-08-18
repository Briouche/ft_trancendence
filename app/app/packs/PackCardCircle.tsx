'use client'

import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'

const RADIUS      = 240 // px, du centre du cercle jusqu'au centre de chaque carte
const CARD_WIDTH  = 108

// Les 10 cartes du paquet posées en cercle plutôt qu'en damier — chaque case reste cliquable
// pour ouvrir la carte en grand (PackCardZoom), une par une.
export default function PackCardCircle({
    cards, revealedIndices, onSelect,
}: {
    cards:           CardFaceData[]
    revealedIndices: Set<number>
    onSelect:        (index: number) => void
}) {
    const n = cards.length
    const size = RADIUS * 2 + CARD_WIDTH * 4 / 3

    return (
        <div className="relative" style={{ width: RADIUS * 2 + CARD_WIDTH, height: size }}>
            {cards.map((card, i) => {
                const angle    = (i / n) * Math.PI * 2 - Math.PI / 2
                const x        = Math.cos(angle) * RADIUS
                const y        = Math.sin(angle) * RADIUS
                const revealed = revealedIndices.has(i)

                return (
                    <button
                        key={`${card.id}-${i}`}
                        onClick={() => onSelect(i)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 hover:z-10"
                        style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, width: CARD_WIDTH }}
                    >
                        {revealed ? (
                            <ScaledCardFace card={card} />
                        ) : (
                            <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg border-[3px]
                                border-gold-500/60 bg-gradient-to-br from-leather-800 to-ink-900 shadow-lg">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gold-400/70 bg-leather-900/60">
                                    <span className="font-display text-base text-gold-400/90">✦</span>
                                </div>
                            </div>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
