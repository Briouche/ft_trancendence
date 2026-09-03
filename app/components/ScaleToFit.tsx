'use client'

import { useEffect, useRef, useState } from 'react'

// Même principe que ScaledCardFace (voir ce fichier) : le contenu (le livre, la bannière...) garde
// ses dimensions "de conception" en pixels fixes — jamais retouchées, tout l'alignement pixel-perfect
// de l'art du notebook reste valable — et c'est un seul transform scale, mesuré sur sa taille
// naturelle (ResizeObserver, non affecté par le transform qu'on applique nous-mêmes) rapportée à la
// fenêtre, qui le fait tenir dans n'importe quelle taille d'écran (portrait 1080×1920 compris).
export default function ScaleToFit({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const innerRef = useRef<HTMLDivElement>(null)
    const naturalSize = useRef({ width: 0, height: 0 })
    const [scale, setScale] = useState(0)

    useEffect(() => {
        const inner = innerRef.current
        if (!inner) return

        const recompute = () => {
            const { width, height } = naturalSize.current
            if (!width || !height) return
            setScale(Math.min(1, window.innerWidth / width, window.innerHeight / height))
        }

        const observer = new ResizeObserver(([entry]) => {
            naturalSize.current = { width: entry.contentRect.width, height: entry.contentRect.height }
            recompute()
        })
        observer.observe(inner)

        window.addEventListener('resize', recompute)
        return () => {
            observer.disconnect()
            window.removeEventListener('resize', recompute)
        }
    }, [])

    return (
        <div className={`flex h-screen w-full items-center justify-center overflow-hidden ${className}`}>
            <div ref={innerRef} style={{ transform: `scale(${scale})` }}>
                {children}
            </div>
        </div>
    )
}
