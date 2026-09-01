'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

// Pièces d'UI partagées par toutes les "pages de carnet" du site (Collection, Deck Builder...) —
// sourcées sur le carnet (03_NoteBook) du Complete UI Book Styles Pack. Extrait de
// CollectionBook.tsx pour être réutilisé tel quel plutôt que dupliqué.

// Boucle sur `count` frames toutes les `intervalMs`, tant que `playing` est vrai (retombe sur la
// frame 1 sinon) — utilisé pour toutes les animations "Sprites Animated" du carnet (sélection,
// flèches) qui doivent boucler en continu plutôt que jouer une fois. requestAnimationFrame (temps
// écoulé réel) plutôt que setInterval : un minuteur qui tourne hors du rythme d'affichage force
// des rendus qui tombent au milieu d'une frame déjà peinte (perdus) ou s'accumulent, alors que
// rAF ne travaille qu'une fois par frame réellement affichée — plus fluide ET moins de travail.
export function useLoopFrame(count: number, intervalMs: number, playing: boolean): number {
    const [frame, setFrame] = useState(1)
    const frameRef = useRef(1)
    useEffect(() => {
        if (!playing) return
        let rafId: number
        let last = performance.now()
        function tick(now: number) {
            if (now - last >= intervalMs) {
                last = now
                frameRef.current = (frameRef.current % count) + 1
                setFrame(frameRef.current)
            }
            rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
        // Le reset à la frame 1 se fait dans le cleanup (pas dans le corps de l'effet) : appeler
        // setState directement dans le corps déclenche des rendus en cascade (règle
        // react-hooks/set-state-in-effect) — le cleanup s'exécute déjà à chaque fois que
        // `playing` repasse à false ou que le composant démonte, donc c'est équivalent.
        return () => { cancelAnimationFrame(rafId); frameRef.current = 1; setFrame(1) }
    }, [playing, count, intervalMs])
    return frame
}

// Cadre de surbrillance (survol de carte, dos de carte équipé, bouton actif) — 4 frames
// "Select01a" du carnet (un léger pulse sur les 4 coins). `animate` ne boucle QUE pendant un
// survol réel : un état persistant (dos de carte équipé, bouton "actif") reste affiché mais figé
// sur la frame 1 tant que la souris n'est pas dessus — les animations ne doivent se déclencher
// qu'au survol, pas rester actives en continu pour un simple état.
export function SelectHighlight({ className = '', animate = true }: { className?: string; animate?: boolean }) {
    const frame = useLoopFrame(4, 150, animate)
    return (
        <div
            className={`pointer-events-none absolute ${className}`}
            style={{
                borderStyle: 'solid',
                borderWidth: 14,
                borderImageSource: `url(/textures/notebook/select/frame-${frame}.png)`,
                borderImageSlice: '36',
                borderImageWidth: '14px',
                borderImageRepeat: 'stretch',
                imageRendering: 'pixelated',
            }}
        />
    )
}

// 4 emplacements par feuille (grille 2×2) × 2 pages = 8 par tournage de page.
export const HALF = 4
export const SLOTS_PER_PAGE = HALF * 2

export function normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// Le champ costNum en base n'est pas fiable (souvent à 0 même quand cost ne l'est pas) :
// on trie donc sur le vrai coût affiché sur la carte. "X" (coût variable) est trié en dernier.
export function parseCost(cost: string): number {
    const n = Number(cost)
    return Number.isNaN(n) ? Infinity : n
}

// La police pixel du site n'a qu'une seule graisse (pas de vrai fichier "Bold") : font-bold seul
// ne s'y voit quasiment pas. Un léger text-shadow de la même couleur dans les 4 directions
// épaissit artificiellement le glyphe pour un vrai effet gras, comme pour les chiffres sur les
// icônes de CardFace.
export const boldNumberStyle = {
    textShadow: '1px 0 0 currentColor, -1px 0 0 currentColor, 0 1px 0 currentColor, 0 -1px 0 currentColor',
}

// Emplacement d'une feuille : surligné avec l'asset "select" du bouquin au survol (pas de clic
// nécessaire pour voir l'état sélectionné). null = case vide (garde la grille 3×2 toujours
// pleinement occupée visuellement, même en fin de liste) — le livre ne doit jamais changer de
// taille selon le nombre de cartes affichées sur la page.
export function Slot({ children, onClick, highlighted, disabled }: {
    children?: React.ReactNode
    onClick?: () => void
    highlighted?: boolean
    disabled?: boolean
}) {
    const [hovered, setHovered] = useState(false)
    const empty = !children

    return (
        <button
            onMouseEnter={() => !empty && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={empty || disabled ? undefined : onClick}
            disabled={empty || disabled}
            className="relative block aspect-[130/191] w-full text-left disabled:cursor-not-allowed"
        >
            {empty ? (
                <div className="h-full w-full rounded-sm border-2 border-dashed border-ink-900/15" />
            ) : (
                <>
                    {(hovered || highlighted) && <SelectHighlight className="-inset-2 z-10" animate={false} />}
                    <div className={`relative h-full ${disabled ? 'opacity-40 grayscale' : ''}`}>{children}</div>
                </>
            )}
        </button>
    )
}

// Animation d'appui du bouton : 4 frames "Button01a" (Sprites Animated du carnet — relâché →
// écrasé), jouées une fois au clic puis retour à la frame 1, même principe que le bouquin
// TravelBook avant lui (juste 4 frames au lieu de 5).
const BUTTON_FRAME_MS = 35
const BUTTON_FRAMES = 4

export function AssetButton({ active, onClick, disabled, className = '', children }: {
    active?: boolean
    onClick?: () => void
    disabled?: boolean
    className?: string
    children: React.ReactNode
}) {
    const [frame, setFrame] = useState(1)
    const [hovered, setHovered] = useState(false)

    function handleClick() {
        if (disabled) return
        onClick?.()
        let i = 1
        const interval = setInterval(() => {
            i += 1
            if (i > BUTTON_FRAMES) { clearInterval(interval); setFrame(1); return }
            setFrame(i)
        }, BUTTON_FRAME_MS)
    }

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`relative flex items-center justify-center font-display font-bold text-ink-text
                transition-opacity disabled:opacity-30 ${className}`}
            style={{
                backgroundImage: `url(/textures/notebook/button/frame-${frame}.png)`,
                backgroundSize: '100% 100%',
                imageRendering: 'pixelated',
            }}
        >
            {active && <SelectHighlight className="-inset-1" animate={hovered} />}
            <span className="relative">{children}</span>
        </button>
    )
}

// Flèche de tournage de page : plus de bouton (fond + cadre) — juste l'icône "Arrow01a" du
// carnet (Sprites Animated, 4 frames), en boucle tant que la souris est proche du bord du livre,
// totalement invisible sinon (pas juste estompée — elle ne doit apparaître QUE quand la souris
// passe dessus). L'icône reste exactement à sa place d'origine (w-20, centrée, pas décalée) —
// seule la ZONE DE DÉTECTION s'agrandit, via un calque invisible séparé (w-16) qui mord sur le
// bord de la page ; le survol est partagé entre les deux (onMouseEnter/Leave sur le wrapper).
// Pointe nativement vers la gauche : "prev" ne se retourne pas, "next" se retourne (scaleX(-1)).
export function PageArrow({ direction, onClick, disabled }: {
    direction: 'prev' | 'next'
    onClick: () => void
    disabled: boolean
}) {
    const [hovered, setHovered] = useState(false)
    const frame = useLoopFrame(4, 110, hovered && !disabled)

    return (
        <div
            className="relative flex h-full shrink-0 items-stretch"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Calque de détection étendu, invisible, mordant sur le bord de la page — ne
                déplace pas l'icône, juste la zone qui déclenche le survol/clic. */}
            <button
                onClick={disabled ? undefined : onClick}
                disabled={disabled}
                aria-hidden="true"
                tabIndex={-1}
                className={`absolute top-0 z-30 h-full w-16 ${direction === 'prev' ? 'left-full' : 'right-full'}`}
            />
            <button
                onClick={onClick}
                disabled={disabled}
                className="relative z-30 flex h-full w-20 shrink-0 items-center justify-center disabled:opacity-0"
            >
                <Image
                    src={`/textures/notebook/arrow/frame-${frame}.png`}
                    alt={direction === 'prev' ? 'Previous page' : 'Next page'}
                    width={12} height={6} unoptimized
                    className="h-7 w-auto transition-opacity"
                    style={{
                        imageRendering: 'pixelated',
                        transform: direction === 'next' ? 'scaleX(-1)' : undefined,
                        opacity: hovered ? 1 : 0,
                    }}
                />
            </button>
        </div>
    )
}

// Champ de recherche isolé dans son propre composant, avec son propre état LOCAL : tape à
// l'écran immédiatement (pas de latence perçue), mais ne remonte la valeur au parent (qui
// déclenche le filtrage + le re-rendu de toute la grille de cartes) que 150ms après la dernière
// frappe. Sans cette isolation, chaque caractère re-rendrait tout le parent (grille comprise)
// même avec un filtrage débouncé côté parent — c'est le composant qui change à chaque frappe qui
// doit rester petit, pas seulement le calcul.
export function SearchInput({ onChange, disabled, placeholder = 'Search a name or an effect…', className = '' }: {
    onChange: (value: string) => void
    disabled?: boolean
    placeholder?: string
    className?: string
}) {
    const [value, setValue] = useState('')
    useEffect(() => {
        const id = setTimeout(() => onChange(value), 150)
        return () => clearTimeout(id)
    }, [value, onChange])

    return (
        <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className={className}
        />
    )
}

// Fond table en bois + voile sombre, commun à toutes les pages de carnet.
export const woodenTableBackground: React.CSSProperties = {
    backgroundImage: [
        'linear-gradient(rgba(10,8,6,0.55), rgba(10,8,6,0.55))',
        'url(/textures/collection/wooden-table.png)',
    ].join(', '),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: '#0e0f10',
}

// Bouton "Menu"/Home fixé en haut-droite de la page — indépendant du centrage du titre/du livre
// plus bas. AssetButton pose déjà "relative" dans ses classes de base, qui l'emporterait sur
// "fixed" passé en className (les classes de position générées par Tailwind ont un ordre interne
// fixe, pas l'ordre du code source) : le positionnement se fait donc sur un wrapper autour du
// bouton, pas sur le bouton lui-même.
export function HomeButton({ onClick }: { onClick: () => void }) {
    return (
        <div className="fixed right-6 top-6 z-40">
            <AssetButton onClick={onClick} className="h-14 w-14 shrink-0">
                {/* Décalée vers le haut : le bas du bouton (Button01a) a un liseré/relief 3D qui
                    grignote la moitié basse, l'icône centrée "au pixel" par flex paraissait donc
                    décentrée vers le bas. */}
                <Image
                    src="/textures/collection/button-home.png" alt="Menu"
                    width={28} height={28} unoptimized
                    className="-translate-y-1"
                    style={{ imageRendering: 'pixelated' }}
                />
            </AssetButton>
        </div>
    )
}

// Bannière-ruban du titre ("Banner01a"), centrée par rapport au livre en dessous.
export function TitleBanner({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex w-[1060px] flex-col items-center gap-1">
            <div className="travelbook-title-banner flex items-center justify-center px-12 py-6">
                {/* Blanc + liseré noir (text-shadow 4 directions, comme les chiffres des cartes)
                    plutôt que le brun ink-text : illisible en trop grand sur le fond crème/orangé
                    du ruban. translateY(-25px) : le bandeau plat du ruban (où le texte doit
                    tenir) est mesuré plus haut que le centre géométrique de tout le sprite — les
                    pans repliés qui pendent en bas alourdissent le bas de l'image sans faire
                    partie de la zone de texte. */}
                <h1
                    className="font-display text-7xl font-bold tracking-wide text-white"
                    style={{
                        transform: 'translateY(-25px)',
                        textShadow: [
                            '-2px -2px 0 #000', '2px -2px 0 #000', '-2px 2px 0 #000', '2px 2px 0 #000',
                            '-2px 0 0 #000', '2px 0 0 #000', '0 -2px 0 #000', '0 2px 0 #000',
                        ].join(', '),
                    }}
                >
                    {children}
                </h1>
            </div>
        </div>
    )
}
