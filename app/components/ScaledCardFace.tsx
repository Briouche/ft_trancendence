'use client'

import { useEffect, useRef, useState } from 'react'
import CardFace, { type CardFaceData } from './CardFace'

// Largeur "de conception" de CardFace : ses tailles de police (emoji, description, stats...)
// sont fixes et calibrées pour un affichage à peu près à cette taille (celle de la grille de la
// Collection). La rendre plus petite qu'à sa largeur naturelle casse la mise en page (texte de
// description qui n'a plus de place, emoji disproportionné) — donc au lieu de la contraindre
// directement dans une cellule de grille étroite, on la rend à sa taille naturelle puis on
// réduit le tout avec un seul transform scale mesuré sur la largeur réelle disponible.
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

// `stackQty` pilote uniquement l'effet de pile (une deuxième carte collée derrière, décalée sur
// la gauche) — séparé de `ownedQty` (qui pilote le badge "x2" dessiné par CardFace) car le Deck
// Builder n'a pas besoin de ce badge (il grise plutôt les calques eux-mêmes, voir `dimFront`/
// `dimBack`). Par défaut `stackQty` retombe sur `ownedQty` pour la Collection, qui n'a besoin que
// d'un seul des deux props.
//
// `dimFront`/`dimBack` : un exemplaire ajouté au deck grise d'abord la carte de derrière (feedback
// visuel immédiat dès le premier clic), un deuxième ajout grise aussi celle de devant (dernière
// restante, plus aucun exemplaire disponible).
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
