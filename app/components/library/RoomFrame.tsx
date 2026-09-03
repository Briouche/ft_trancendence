'use client'

import { type ReactNode } from 'react'
import RoomCanvas from './RoomCanvas'

// Cadre partagé pour les "salles" de la bibliothèque (atelier du scribe, coffre à paquets...) :
// un vrai décor three-fiber en fond plein écran (même ambiance/lanterne que le reste du site),
// et l'UI 2D existante de la page (formulaires, listes) posée par-dessus, inchangée dans sa
// logique. `decor` contient des éléments three-fiber (mesh/group), rendus à l'intérieur du
// Canvas de RoomCanvas — plus des `<div>` positionnées en absolu.
export default function RoomFrame({ decor, children, parallax }: { decor?: ReactNode; children?: ReactNode; parallax?: boolean }) {
    return (
        <div className="relative min-h-screen w-full bg-ink-950">
            <div className="fixed inset-0 overflow-hidden">
                <RoomCanvas parallax={parallax}>{decor}</RoomCanvas>
            </div>
            <div className="relative z-10">
                {children}
            </div>
        </div>
    )
}
