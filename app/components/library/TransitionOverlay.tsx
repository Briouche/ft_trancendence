'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

/** Fade from black on every route change (mounted once by the root layout). */
export default function TransitionOverlay() {
    const pathname = usePathname()
    const [covering, setCovering] = useState(true)
    const [shownPath, setShownPath] = useState(pathname)

    // New route: cover the screen again. Adjusting state during render (instead of in an
    // effect) is React's recommended way to reset state when a value changes.
    if (shownPath !== pathname) {
        setShownPath(pathname)
        setCovering(true)
    }

    useEffect(() => {
        if (!covering) return
        const timer = setTimeout(() => setCovering(false), 30)
        return () => clearTimeout(timer)
    }, [covering, pathname])

    return (
        <div
            aria-hidden
            className={`pointer-events-none fixed inset-0 z-50 bg-[#0a0704] transition-opacity duration-700 ${
                covering ? 'opacity-100' : 'opacity-0'
            }`}
        />
    )
}
