'use client'

import { useEffect, useRef, useState } from 'react'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'
import CardBackArt from '@/components/CardBackArt'

// Tailles en fonction de vmin (1% de la plus petite dimension de la fenêtre) plutôt qu'en pixels
// fixes : le cercle occupe alors toujours la même proportion de la page, quelle que soit sa
// taille, sans jamais déborder en bas (les cartes du bas sortaient de l'écran avec des px fixes).
// Le ratio rayon/largeur est choisi pour que les cartes espacées régulièrement ne se touchent pas :
// la distance entre deux cartes voisines (corde du cercle) doit dépasser la hauteur d'une carte.
const RADIUS_VMIN     = 36
const CARD_WIDTH_VMIN = 15
const TILT_DEGREES    = 7

function clamp(v: number, min: number, max: number) {
    return Math.max(min, Math.min(max, v))
}

function useVmin() {
    const [vmin, setVmin] = useState(0)
    useEffect(() => {
        function update() { setVmin(Math.min(window.innerWidth, window.innerHeight) / 100) }
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])
    return vmin
}

// Les 10 cartes du paquet posées en cercle plutôt qu'en damier — chaque case reste cliquable
// pour ouvrir la carte en grand (PackCardZoom). La bascule à la souris (parallaxe) est active
// directement sur les 10, en continu, pas seulement une fois une carte agrandie.
export default function PackCardCircle({
    cards, revealedIndices, onSelect, cardBack,
}: {
    cards:           CardFaceData[]
    revealedIndices: Set<number>
    onSelect:        (index: number) => void
    cardBack:        number
}) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null)
    const vmin = useVmin()

    useEffect(() => {
        function onMove(e: MouseEvent) {
            setMouse({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', onMove)
        return () => window.removeEventListener('mousemove', onMove)
    }, [])

    const radius     = vmin * RADIUS_VMIN
    const cardWidth  = vmin * CARD_WIDTH_VMIN
    const cardHeight = cardWidth * 4 / 3
    const n = cards.length
    const size = radius * 2 + cardHeight
    const rect = containerRef.current?.getBoundingClientRect()

    return (
        // pointer-events-none : le centre du cercle (où trône le coffre) n'a aucune carte —
        // sans ça, ce conteneur (vide mais bien réel) intercepte les clics destinés à tout ce
        // qui est affiché par-dessus à cet endroit (le zoom d'une carte, centré au même point).
        <div ref={containerRef} className="relative pointer-events-none" style={{ width: size, height: size }}>
            {cards.map((card, i) => {
                const angle    = (i / n) * Math.PI * 2 - Math.PI / 2
                const x        = Math.cos(angle) * radius
                const y        = Math.sin(angle) * radius
                const revealed = revealedIndices.has(i)

                let tiltX = 0
                let tiltY = 0
                if (mouse && rect) {
                    const cardCenterX = rect.left + rect.width / 2 + x
                    const cardCenterY = rect.top + rect.height / 2 + y
                    tiltX = clamp((mouse.x - cardCenterX) / (cardWidth * 2), -1, 1)
                    tiltY = clamp((mouse.y - cardCenterY) / (cardHeight * 2), -1, 1)
                }

                return (
                    <button
                        key={`${card.id}-${i}`}
                        onClick={() => onSelect(i)}
                        className="pointer-events-auto absolute transition-transform duration-150 ease-out hover:z-10"
                        style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            width: cardWidth,
                            transform: `translate(-50%, -50%) perspective(700px) rotateY(${tiltX * TILT_DEGREES}deg) rotateX(${-tiltY * TILT_DEGREES}deg)`,
                        }}
                    >
                        {/* Le retournement se joue ici, sur place, à cette petite taille — plus
                            besoin de passer par le zoom pour la première révélation. */}
                        <div className="[perspective:600px]">
                            <div
                                className={`relative aspect-[3/4] w-full transition-transform duration-500 [transform-style:preserve-3d]
                                    ${revealed ? '[transform:rotateY(180deg)]' : ''}`}
                            >
                                {/* Pas de bordure ajoutée ici (contrairement au dos par défaut avant) :
                                    chaque design du catalogue a déjà son propre cadre dessiné dans le
                                    sprite — en superposer une créait un double-cadre qui mangeait le bord
                                    de l'image et donnait l'impression qu'elle ne remplissait pas la carte. */}
                                <CardBackArt
                                    index={cardBack}
                                    className="h-full w-full rounded-lg shadow-lg [backface-visibility:hidden]"
                                />
                                {/* Éclat doré ponctuel à la révélation, en plus du contour de
                                    CardFace lui-même — le pull d'une légendaire doit se sentir. */}
                                <div className={`absolute inset-0 rounded-lg [backface-visibility:hidden] [transform:rotateY(180deg)]
                                    ${revealed && card.rarity === 'Légendaire' ? 'animate-legendary-reveal' : ''}`}>
                                    <ScaledCardFace card={card} />
                                </div>
                            </div>
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
