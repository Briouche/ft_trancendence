'use client'

import { type ReactNode } from 'react'
import RoomFrame from '@/components/library/RoomFrame'
import LibraryDoor from '@/components/library/LibraryDoor'

// Salle d'entrée : la porte de la bibliothèque en fond (même caméra/ambiance que les autres
// salles, via RoomFrame), le formulaire de connexion posé par-dessus — se connecter, c'est
// pousser la porte.
export default function EntranceRoom({ children }: { children: ReactNode }) {
    return (
        <RoomFrame decor={<LibraryDoor />} parallax={false}>
            {/* RoomFrame ne force pas de layout flex sur ses children — on reproduit ici la
                colonne plein écran que Header/Footer/
                SignInForm attendaient de <body>, pour que SignInForm se centre bien entre les
                deux. min-h-dvh (pas min-h-screen) : colle vraiment le footer en bas de l'écran
                visible même quand la barre d'adresse du navigateur va et vient. */}
            <div className="min-h-dvh flex flex-col">
                {children}
            </div>
        </RoomFrame>
    )
}
