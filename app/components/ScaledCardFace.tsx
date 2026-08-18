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

export default function ScaledCardFace({ card, ownedQty }: { card: CardFaceData; ownedQty?: number }) {
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
        <div ref={outerRef} className="aspect-[3/4] w-full overflow-hidden">
            <div style={{ width: NATURAL_WIDTH, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
                <CardFace card={card} ownedQty={ownedQty} />
            </div>
        </div>
    )
}
