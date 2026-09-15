'use client'

import { useEffect, useState } from 'react'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'
import CardBackArt from '@/components/CardBackArt'
import { AssetButton } from '@/components/notebook/NotebookUI'

// Sizes in vmin so the circle keeps the same proportion of the viewport.
const RADIUS_VMIN     = 36
const CARD_WIDTH_VMIN = 15

// Hover glow color hinting the rarity of a still face-down card (none for Common).
const HOVER_RARITY_GLOW: Partial<Record<string, string>> = {
    'Rare':        '#3b82f6',
    'Épique':      '#a855f7',
    'Légendaire':  '#facc15',
}

function useVmin() {
    const [vmin, setVmin] = useState(0)
    useEffect(() => {
        function update() { setVmin(Math.min(window.innerWidth, window.innerHeight) / 100) }
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])
    return vmin
}

// The pack's cards laid out in a circle; each flips on click. Once all are revealed, back and
// collection buttons appear in the center.
export default function PackCardCircle({
    cards, revealedIndices, onSelect, onBack, onViewCollection, cardBack,
}: {
    cards:            CardFaceData[]
    revealedIndices:  Set<number>
    onSelect:         (index: number) => void
    onBack:           () => void
    onViewCollection: () => void
    cardBack:         number
}) {
    const allRevealed = cards.length > 0 && revealedIndices.size === cards.length
    const vmin = useVmin()

    const radius     = vmin * RADIUS_VMIN
    const cardWidth  = vmin * CARD_WIDTH_VMIN
    const cardHeight = cardWidth * 4 / 3
    const n = cards.length
    const size = radius * 2 + cardHeight

    return (
        <div className="relative pointer-events-none" style={{ width: size, height: size }}>
            {allRevealed && (
                <div className="pointer-events-auto absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 gap-3">
                    <AssetButton onClick={onBack} variant="back" className="h-14 w-14 shrink-0" />
                    <AssetButton onClick={onViewCollection} variant="manual" className="h-14 w-14 shrink-0" />
                </div>
            )}

            {cards.map((card, i) => {
                const angle    = (i / n) * Math.PI * 2 - Math.PI / 2
                const x        = Math.cos(angle) * radius
                const y        = Math.sin(angle) * radius
                const revealed = revealedIndices.has(i)
                const hoverGlow = HOVER_RARITY_GLOW[card.rarity]

                return (
                    <button
                        key={`${card.id}-${i}`}
                        onClick={() => onSelect(i)}
                        className="group pointer-events-auto absolute transition-transform duration-150 ease-out hover:z-10"
                        style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            width: cardWidth,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        <div className={`transition-transform duration-150 ease-out perspective-[600px]
                            ${!revealed ? 'group-hover:scale-110' : ''}`}>
                            <div
                                className={`relative aspect-3/4 w-full transition-transform duration-500 [transform-style:preserve-3d]
                                    ${revealed ? '[transform:rotateY(180deg)]' : ''}`}
                            >
                                <CardBackArt
                                    index={cardBack}
                                    className="h-full w-full rounded-lg shadow-lg [backface-visibility:hidden]"
                                />
                                {!revealed && hoverGlow && (
                                    <div
                                        className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity
                                            duration-300 [backface-visibility:hidden] group-hover:opacity-100"
                                        style={{ boxShadow: `0 0 40px 12px ${hoverGlow}` }}
                                    />
                                )}
                                <div className={`absolute inset-0 rounded-lg [backface-visibility:hidden] [transform:rotateY(180deg)]
                                    ${revealed && card.rarity === 'Légendaire' ? 'animate-legendary-reveal' : ''}`}>
                                    <ScaledCardFace card={card} />
                                </div>
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
