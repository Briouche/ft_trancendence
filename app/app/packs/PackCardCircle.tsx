'use client'

import { useEffect, useState } from 'react'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'
import CardBackArt from '@/components/CardBackArt'
import { AssetButton } from '@/components/notebook/NotebookUI'

// Sizes are in vmin rather than fixed pixels, so the circle keeps the same proportion of the
// page at any viewport size. The radius/width ratio keeps neighboring cards from touching: the
// chord between them must exceed a card's height.
const RADIUS_VMIN     = 36
const CARD_WIDTH_VMIN = 15

// Hover glow on a card not yet flipped — a rarity hint before it's even revealed. No entry for
// Common: nothing to tease, so no glow at all.
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

// The pack's 10 cards laid out in a circle rather than a grid — each slot stays clickable to
// open the card full-screen (PackCardZoom). No more mouse parallax: cards stay still (both back
// and revealed), only the click-triggered flip still animates anything.
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
        // pointer-events-none: the circle's empty center would otherwise intercept clicks meant
        // for whatever renders on top of it (a card zoom, centered on the same point).
        <div className="relative pointer-events-none" style={{ width: size, height: size }}>
            {/* Back arrow + Collection shortcut, centered — only shown once everything is
                revealed. Uses 01_TravelBook buttons (ButtonBack01a, ButtonManual01a reused as
                the Collection shortcut) since this asset book has no dedicated "cards" sprite. */}
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
                        {/* The flip plays here at small size, no zoom needed for the first
                            reveal. Hover growth lives on this outer layer (not the rotating one)
                            so it doesn't compete with the flip for the transform property. */}
                        <div className={`transition-transform duration-150 ease-out perspective-[600px]
                            ${!revealed ? 'group-hover:scale-110' : ''}`}>
                            <div
                                className={`relative aspect-3/4 w-full transition-transform duration-500 [transform-style:preserve-3d]
                                    ${revealed ? '[transform:rotateY(180deg)]' : ''}`}
                            >
                                {/* No border added here: every catalog design already has its
                                    own frame baked into the sprite — an extra one doubled up and
                                    ate into the image's edge. */}
                                <CardBackArt
                                    index={cardBack}
                                    className="h-full w-full rounded-lg shadow-lg [backface-visibility:hidden]"
                                />
                                {/* Hover glow while the card still shows its back: a rarity hint
                                    before the reveal — Common has no entry in HOVER_RARITY_GLOW,
                                    so nothing shows for it. */}
                                {!revealed && hoverGlow && (
                                    <div
                                        className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity
                                            duration-300 [backface-visibility:hidden] group-hover:opacity-100"
                                        style={{ boxShadow: `0 0 40px 12px ${hoverGlow}` }}
                                    />
                                )}
                                {/* One-off golden flash on reveal, on top of CardFace's own
                                    outline — pulling a legendary needs to feel like an event. */}
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
