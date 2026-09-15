'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

// Fade from black on every route change.
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
