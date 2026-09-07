'use client'

import { useEffect, useState } from 'react'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'
import CardBackArt from '@/components/CardBackArt'
import { AssetButton } from '@/components/notebook/NotebookUI'

// Tailles en fonction de vmin (1% de la plus petite dimension de la fenêtre) plutôt qu'en pixels
// fixes : le cercle occupe alors toujours la même proportion de la page, quelle que soit sa
// taille, sans jamais déborder en bas (les cartes du bas sortaient de l'écran avec des px fixes).
// Le ratio rayon/largeur est choisi pour que les cartes espacées régulièrement ne se touchent pas :
// la distance entre deux cartes voisines (corde du cercle) doit dépasser la hauteur d'une carte.
const RADIUS_VMIN     = 36
const CARD_WIDTH_VMIN = 15

// Aura au survol d'une carte pas encore retournée — un indice de rareté avant même de la
// révéler. Pas d'entrée pour Commune : rien à teaser, donc pas d'aura du tout.
const HOVER_RARITY_GLOW: Partial<Record<string, string>> = {
    'Rare':        '#3b82f6',
    'Épique':      '#a855f7',
    'Légendaire':  '#facc15',
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
// pour ouvrir la carte en grand (PackCardZoom). Plus de parallaxe à la souris : les cartes
// restent immobiles (dos comme révélées), seul le retournement au clic anime encore quelque chose.
export default function PackCardCircle({
    cards, revealedIndices, onSelect, onBack, onViewCollection, cardBack,
}: {
    cards:            CardFaceData[]
    revealedIndices:  Set<number>
    onSelect:         (index: number) => void
    onBack:           () => void
    onViewCollection: () => void
    cardBack:         number
}) {
    const allRevealed = cards.length > 0 && revealedIndices.size === cards.length
    const vmin = useVmin()

    const radius     = vmin * RADIUS_VMIN
    const cardWidth  = vmin * CARD_WIDTH_VMIN
    const cardHeight = cardWidth * 4 / 3
    const n = cards.length
    const size = radius * 2 + cardHeight

    return (
        // pointer-events-none : le centre du cercle (où trône le coffre) n'a aucune carte —
        // sans ça, ce conteneur (vide mais bien réel) intercepte les clics destinés à tout ce
        // qui est affiché par-dessus à cet endroit (le zoom d'une carte, centré au même point).
        <div className="relative pointer-events-none" style={{ width: size, height: size }}>
            {/* Flèche de retour + raccourci Collection, au centre du cercle — seulement une fois
                tout révélé (pas de sortie prématurée pendant qu'il reste des cartes face cachée).
                Deux boutons 01_TravelBook (Sprites Animated) plutôt que le carré générique + icône
                séparée : ButtonBack01a pour le retour, ButtonManual01a (icône livre) réutilisé
                comme raccourci Collection — pas de sprite "cartes" dédié dans ce bouquin. */}
            {allRevealed && (
                <div className="pointer-events-auto absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 gap-3">
                    <AssetButton onClick={onBack} variant="back" className="h-14 w-14 shrink-0" />
                    <AssetButton onClick={onViewCollection} variant="manual" className="h-14 w-14 shrink-0" />
                </div>
            )}

            {cards.map((card, i) => {
                const angle    = (i / n) * Math.PI * 2 - Math.PI / 2
                const x        = Math.cos(angle) * radius
                const y        = Math.sin(angle) * radius
                const revealed = revealedIndices.has(i)
                const hoverGlow = HOVER_RARITY_GLOW[card.rarity]

                return (
                    <button
                        key={`${card.id}-${i}`}
                        onClick={() => onSelect(i)}
                        className="group pointer-events-auto absolute transition-transform duration-150 ease-out hover:z-10"
                        style={{
                            left: `calc(50% + ${x}px)`,
                            top: `calc(50% + ${y}px)`,
                            width: cardWidth,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        {/* Le retournement se joue ici, sur place, à cette petite taille — plus
                            besoin de passer par le zoom pour la première révélation. Grossit
                            légèrement au survol tant qu'elle n'est pas encore retournée (même
                            portée que l'aura ci-dessous) — sur ce calque, pas celui qui tourne,
                            pour ne pas se disputer la propriété transform avec le flip. */}
                        <div className={`transition-transform duration-150 ease-out [perspective:600px]
                            ${!revealed ? 'group-hover:scale-110' : ''}`}>
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
                                {/* Aura au survol, tant que la carte est encore dos visible : un indice
                                    de rareté avant la révélation — Commune n'a pas d'entrée dans
                                    HOVER_RARITY_GLOW, donc rien ne s'affiche pour elle. */}
                                {!revealed && hoverGlow && (
                                    <div
                                        className="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity
                                            duration-300 [backface-visibility:hidden] group-hover:opacity-100"
                                        style={{ boxShadow: `0 0 40px 12px ${hoverGlow}` }}
                                    />
                                )}
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
