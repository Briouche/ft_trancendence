'use client'

import { useEffect, useRef, useState } from 'react'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'

type Card = CardFaceData & { ownedQty: number }

// Zoom plein écran d'une carte, en DOM plat (pas dans la scène 3D) : bien plus net, et évite de
// refaire tout le calage caméra/distanceFactor qui a déjà donné du fil à retordre côté livre.
// La légère bascule qui suit la souris (parallaxe) est un simple transform CSS, amorti par une
// transition plutôt qu'un vrai ressort — suffisant pour l'effet recherché ici.
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
                    {/* stackQty=1 : le zoom montre toujours une seule carte (avec son badge xN),
                        pas l'effet de pile à deux calques utilisé dans la grille de la Collection. */}
                    <ScaledCardFace card={card} ownedQty={card.ownedQty} stackQty={1} />
                </div>

                {/* Signature de l'illustrateur, sous la carte (pas sur son visuel) — absente tant
                    que `artist` n'est pas renseigné pour cette carte (voir tcg-collection.json). */}
                {card.artist && (
                    <p className="font-serif text-2xl italic text-parchment-300/70">{card.artist}</p>
                )}
            </div>
        </div>
    )
}
