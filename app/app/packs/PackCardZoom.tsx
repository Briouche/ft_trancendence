'use client'

import { useEffect, useRef, useState } from 'react'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'

// Grand plan d'une carte déjà révélée du paquet, avec la même bascule qui suit la souris
// (parallaxe) que le zoom de la Collection. Le retournement se joue désormais directement dans
// le cercle (PackCardCircle) — ce zoom n'est plus qu'un "regarder de plus près" volontaire,
// ouvert par un second clic sur une carte déjà retournée, fermé par un clic à côté.
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
        // pointer-events-auto : `pointer-events` est hérité, et le conteneur racine de
        // PackOpener est passé en pointer-events-none pour laisser les clics atteindre les
        // paquets/cartes affichés par-dessus — sans ce reset explicite ici, ce plein écran
        // hériterait ce "none" et deviendrait entièrement inerte (aucun clic, ni sur la carte
        // ni sur le fond pour fermer).
        <div
            className="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-ink-950/70 backdrop-blur-lg"
            onClick={onClose}
        >
            <div
                ref={cardRef}
                onClick={e => e.stopPropagation()}
                className="w-[300px] transition-transform duration-150 ease-out will-change-transform"
                style={{
                    transform: `perspective(900px) rotateY(${tilt.x * 10}deg) rotateX(${-tilt.y * 10}deg) scale(1.04)`,
                }}
            >
                <ScaledCardFace card={card} />
            </div>

            {/* Signature de l'illustrateur, sous la carte — absente tant que `artist` n'est pas
                renseigné pour cette carte (voir tcg-collection.json). */}
            {card.artist && (
                <p className="font-serif text-2xl italic text-parchment-300/70">{card.artist}</p>
            )}

            <p className="font-serif text-sm italic text-parchment-300/50">Click outside to close</p>
        </div>
    )
}
