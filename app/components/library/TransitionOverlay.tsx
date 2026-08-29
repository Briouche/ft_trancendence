'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// Masque la (re)création du Canvas à chaque navigation par un fondu au noir : on "entre"
// dans la salle suivante depuis l'obscurité plutôt que de voir la page se recomposer d'un coup.
export default function TransitionOverlay() {
    const pathname = usePathname()
    const [covering, setCovering] = useState(true)

    useEffect(() => {
        setCovering(true)
        const timer = setTimeout(() => setCovering(false), 30)
        return () => clearTimeout(timer)
    }, [pathname])

    return (
        <div
            aria-hidden
            className={`pointer-events-none fixed inset-0 z-50 bg-[#0a0704] transition-opacity duration-700 ${
                covering ? 'opacity-100' : 'opacity-0'
            }`}
        />
    )
}
