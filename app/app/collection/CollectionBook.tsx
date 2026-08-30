'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'
import CardBackArt from '@/components/CardBackArt'
import { CARD_BACK_COUNT } from '@/lib/cardBacks'
import CardZoom from './CardZoom'

// Boucle sur `count` frames toutes les `intervalMs`, tant que `playing` est vrai (retombe sur la
// frame 1 sinon) — utilisé pour toutes les animations "Sprites Animated" du carnet (sélection,
// flèches) qui doivent boucler en continu plutôt que jouer une fois. requestAnimationFrame (temps
// écoulé réel) plutôt que setInterval : un minuteur qui tourne hors du rythme d'affichage force
// des rendus qui tombent au milieu d'une frame déjà peinte (perdus) ou s'accumulent, alors que
// rAF ne travaille qu'une fois par frame réellement affichée — plus fluide ET moins de travail.
function useLoopFrame(count: number, intervalMs: number, playing: boolean): number {
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
function SelectHighlight({ className = '', animate = true }: { className?: string; animate?: boolean }) {
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

type Card = CardFaceData & { ownedQty: number }
type Tab = 'cards' | 'backs'

// 4 emplacements par feuille (grille 2×2) × 2 pages = 8 par tournage de page.
const HALF = 4
const SLOTS_PER_PAGE = HALF * 2

function normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// Le champ costNum en base n'est pas fiable (souvent à 0 même quand cost ne l'est pas) :
// on trie donc sur le vrai coût affiché sur la carte. "X" (coût variable) est trié en dernier.
function parseCost(cost: string): number {
    const n = Number(cost)
    return Number.isNaN(n) ? Infinity : n
}

const COST_FILTERS = [1, 2, 3, 4, 5, 6, 7]

// La police pixel du site n'a qu'une seule graisse (pas de vrai fichier "Bold") : font-bold seul
// ne s'y voit quasiment pas. Un léger text-shadow de la même couleur dans les 4 directions
// épaissit artificiellement le glyphe pour un vrai effet gras, comme pour les chiffres sur les
// icônes de CardFace.
const boldNumberStyle = {
    textShadow: '1px 0 0 currentColor, -1px 0 0 currentColor, 0 1px 0 currentColor, 0 -1px 0 currentColor',
}

// Emplacement d'une feuille : surligné avec l'asset "select" du bouquin au survol (pas de clic
// nécessaire pour voir l'état sélectionné). null = case vide (garde la grille 3×2 toujours
// pleinement occupée visuellement, même en fin de liste) — le livre ne doit jamais changer de
// taille selon le nombre de cartes affichées sur la page.
function Slot({ children, onClick, highlighted }: { children?: React.ReactNode; onClick?: () => void; highlighted?: boolean }) {
    const [hovered, setHovered] = useState(false)
    const empty = !children

    return (
        <button
            onMouseEnter={() => !empty && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={empty ? undefined : onClick}
            disabled={empty}
            className="relative block aspect-[130/191] w-full text-left"
        >
            {empty ? (
                <div className="h-full w-full rounded-sm border-2 border-dashed border-ink-900/15" />
            ) : (
                <>
                    {(hovered || highlighted) && <SelectHighlight className="-inset-2 z-10" animate={false} />}
                    <div className="relative h-full">{children}</div>
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

function AssetButton({ active, onClick, disabled, className = '', children }: {
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

// Onglets Cards/Card Backs à cheval sur le bord GAUCHE du livre (comme dans la preview du pack :
// une pile d'onglets verticaux qui dépassent sur le côté, pas au-dessus des pages). Le sprite
// marqueur (Sprites Animated) est natif pour ce montage — bord plat = côté attaché, bord arrondi
// = côté qui dépasse — donc mis à plat (pas de rotation, juste un miroir horizontal) : voir
// public/textures/notebook/marker-side, recadré au contenu réel de chaque frame (le canevas
// source est de taille fixe mais le contenu dessiné dedans ne touche PAS toujours le bord droit,
// même refermé — sans ce recadrage un vide transparent restait visible entre l'onglet et le
// livre). Largeur différente par état (le carré source recadré n'a pas la même largeur ouvert/
// fermé), hauteur commune — la pile est alignée à droite (items-end) pour que le bord attaché
// reste bien flush contre le livre quelle que soit la largeur. Actif = frame "open-3" (pas la
// plus grande, open-6) : passé un certain point le liseré noir du marqueur s'estompe en beige
// vers son bord attaché (dégradé voulu par l'asset), donc plus on ouvre, plus il y a de beige
// entre le noir du marqueur et celui de la page — impossible de les faire vraiment se toucher
// perpendiculairement avec une frame trop ouverte. open-3 garde un vrai bord noir jusqu'à
// quelques pixels du bord, assez pour rejoindre le liseré de la page une fois le recouvrement
// ajusté (voir l'appelant).
const SIDE_TAB_OPEN_WIDTH = 88
const SIDE_TAB_CLOSED_WIDTH = 56
const SIDE_TAB_HEIGHT = 88

function SideTab({ active, onClick, className = '', children }: {
    active: boolean
    onClick: () => void
    className?: string
    children?: React.ReactNode
}) {
    return (
        <button
            onClick={onClick}
            className={`relative flex items-center justify-center transition-[width] duration-200 ease-out ${className}`}
            style={{
                // La pile entière est alignée à droite (items-end, voir l'appelant) : cette
                // largeur grandit/rétrécit donc depuis le bord DROIT (attaché au livre) vers la
                // gauche — l'onglet a bien l'air de sortir du livre en s'ouvrant, pas de gonfler
                // sur place. Le sprite change de frame en même temps (pas de morphing entre les
                // deux images, juste la largeur de la boîte qui les entoure).
                width: active ? SIDE_TAB_OPEN_WIDTH : SIDE_TAB_CLOSED_WIDTH,
                height: SIDE_TAB_HEIGHT,
                backgroundImage: `url(/textures/notebook/marker-side/${active ? 'open-3' : 'open-1'}.png)`,
                backgroundSize: '100% 100%',
                imageRendering: 'pixelated',
            }}
        >
            {/* Icône visible seulement sur l'onglet actif — comme la preview du pack, où les
                onglets fermés sont de simples pastilles vides, pas juste plus petites. */}
            {active && children}
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
function PageArrow({ direction, onClick, disabled }: {
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
// frappe. Sans cette isolation, chaque caractère re-rendrait tout CollectionBook (grille comprise)
// même avec un filtrage débouncé côté parent — c'est le composant qui change à chaque frappe qui
// doit rester petit, pas seulement le calcul.
function SearchInput({ onChange, disabled, className = '' }: {
    onChange: (value: string) => void
    disabled?: boolean
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
            placeholder="Search a name or an effect…"
            className={className}
        />
    )
}

export default function CollectionBook({ cards, initialCardBack, unlockedCardBacks, totalCardCount }: {
    cards: Card[]
    initialCardBack: number
    unlockedCardBacks: number[]
    totalCardCount: number
}) {
    const router = useRouter()
    const [tab, setTab] = useState<Tab>('cards')
    // Débouncé par construction : ne vient QUE de SearchInput (voir plus haut), qui ne le
    // remonte que 150ms après la dernière frappe — donc CollectionBook (et sa grosse grille de
    // 8× ScaledCardFace/CardFace) ne se re-rend pas à chaque caractère tapé, seulement une fois
    // la frappe terminée. Champ isolé dans son propre composant avec un état LOCAL pour rester
    // instantané à l'écran pendant ce délai (mesuré à 10-23ms de re-rendu complet par touche
    // sinon — au-delà du budget d'une frame à 60fps, d'où l'input qui traînait).
    const [search, setSearch] = useState('')
    const [costFilter, setCostFilter] = useState<number | null>(null)
    const [cardsPage, setCardsPage] = useState(0)
    const [backsPage, setBacksPage] = useState(0)
    const [zoomedCard, setZoomedCard] = useState<Card | null>(null)
    const [cardBack, setCardBack] = useState(initialCardBack)
    const [savingBack, setSavingBack] = useState<number | null>(null)

    const unlocked = useMemo(() => new Set(unlockedCardBacks), [unlockedCardBacks])

    const filteredCards = useMemo(() => {
        const query = normalize(search.trim())
        let matches = query === ''
            ? cards
            : cards.filter(c => normalize(c.name).includes(query)
                || normalize(c.desc).includes(query)
                || normalize(c.rarity).includes(query))

        if (costFilter !== null) {
            // Plus d'éclair dédié au coût 0 (étoile retirée) : le premier éclair ("1") absorbe
            // aussi les cartes à 0 mana, sinon elles ne seraient plus filtrables du tout.
            matches = costFilter === 1
                ? matches.filter(c => parseCost(c.cost) <= 1)
                : matches.filter(c => parseCost(c.cost) === costFilter)
        }

        // Plus de boutons de tri dans l'UI (retirés au profit du mana sur la page droite) :
        // tri fixé sur son réglage par défaut (coût croissant).
        return [...matches].sort((a, b) => parseCost(a.cost) - parseCost(b.cost))
    }, [cards, search, costFilter])

    const cardsTotalPages = Math.max(1, Math.ceil(filteredCards.length / SLOTS_PER_PAGE))
    const currentCardsPage = Math.min(cardsPage, cardsTotalPages - 1)
    const visibleCards = filteredCards.slice(currentCardsPage * SLOTS_PER_PAGE, currentCardsPage * SLOTS_PER_PAGE + SLOTS_PER_PAGE)

    const backIndices = useMemo(() => Array.from({ length: CARD_BACK_COUNT }, (_, i) => i), [])
    const backsTotalPages = Math.max(1, Math.ceil(CARD_BACK_COUNT / SLOTS_PER_PAGE))
    const currentBacksPage = Math.min(backsPage, backsTotalPages - 1)
    const visibleBacks = backIndices.slice(currentBacksPage * SLOTS_PER_PAGE, currentBacksPage * SLOTS_PER_PAGE + SLOTS_PER_PAGE)

    const page = tab === 'cards' ? currentCardsPage : currentBacksPage
    const totalPages = tab === 'cards' ? cardsTotalPages : backsTotalPages

    function goPrev() {
        if (tab === 'cards') setCardsPage(p => Math.max(0, p - 1))
        else setBacksPage(p => Math.max(0, p - 1))
    }
    function goNext() {
        if (tab === 'cards') setCardsPage(p => Math.min(cardsTotalPages - 1, p + 1))
        else setBacksPage(p => Math.min(backsTotalPages - 1, p + 1))
    }

    // useCallback (identité stable) : passée à SearchInput comme dépendance de son effet de
    // debounce — une fonction recréée à chaque rendu de CollectionBook y relancerait le délai à
    // chaque frappe du parent (aucune ici, mais par principe).
    const updateSearch = useCallback((value: string) => {
        setSearch(value)
        setCardsPage(0)
    }, [])

    function toggleCostFilter(value: number) {
        setCostFilter(f => f === value ? null : value)
        setCardsPage(0)
    }

    async function chooseBack(index: number) {
        if (index === cardBack || !unlocked.has(index) || savingBack !== null) return
        setSavingBack(index)
        const res = await fetch('/api/user/card-back', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardBack: index }),
        })
        if (res.ok) setCardBack(index)
        setSavingBack(null)
    }

    // Complète toujours à 6 (padding `null`) : la grille 3×2 reste pleine même en fin de liste.
    function padToHalf<T>(items: T[]): (T | null)[] {
        return [...items, ...Array(Math.max(0, HALF - items.length)).fill(null)]
    }

    const visibleItems: (Card | number)[] = tab === 'cards' ? visibleCards : visibleBacks
    const leftItems = padToHalf(visibleItems.slice(0, HALF))
    const rightItems = padToHalf(visibleItems.slice(HALF))

    function renderSlot(item: Card | number | null, slotIndex: number) {
        if (item === null) return <Slot key={`empty-${slotIndex}`} />
        if (typeof item === 'number') {
            return (
                <Slot key={item} onClick={() => chooseBack(item)} highlighted={item === cardBack}>
                    <CardBackArt
                        index={item}
                        className={`h-full w-full rounded-sm ${!unlocked.has(item) ? 'grayscale brightness-50' : ''}`}
                    />
                    {!unlocked.has(item) && (
                        <span className="absolute inset-0 flex items-center justify-center">
                            <Image src="/textures/collection/icon-locked.png" alt="Locked" width={28} height={40} unoptimized style={{ imageRendering: 'pixelated' }} />
                        </span>
                    )}
                </Slot>
            )
        }
        return (
            <Slot key={item.id} onClick={() => setZoomedCard(item)}>
                <ScaledCardFace card={item} ownedQty={item.ownedQty} />
            </Slot>
        )
    }

    return (
        // Table en bois (fournie par l'utilisateur, Downloads/wooden_table.png) en fond de la
        // Collection à la place du simple bg-ink-950 : le livre a l'air posé dessus. Voile sombre
        // en dégradé superposé (pas l'image seule) pour garder assez de contraste avec le livre
        // clair — sans lui, le bois moyen-clair réduisait la lisibilité des bords du livre.
        <div
            className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 md:p-10"
            style={{
                backgroundImage: [
                    'linear-gradient(rgba(10,8,6,0.55), rgba(10,8,6,0.55))',
                    'url(/textures/collection/wooden-table.png)',
                ].join(', '),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: '#0e0f10',
            }}
        >
            {/* Bouton Menu : coin haut-droite de la PAGE (fixed, pas juste à côté du ruban) —
                indépendant du centrage du titre/du livre plus bas. AssetButton pose déjà
                "relative" dans ses classes de base, qui l'emporterait sur "fixed" passé en
                className (même bug que le halo de sélection plus tôt) : le positionnement se
                fait donc sur un wrapper autour du bouton, pas sur le bouton lui-même. */}
            <div className="fixed right-6 top-6 z-40">
                <AssetButton onClick={() => router.push('/')} className="h-14 w-14 shrink-0">
                    {/* Décalée vers le haut : le bas du bouton (Button01a) a un liseré/relief 3D
                        qui grignote la moitié basse, l'icône centrée "au pixel" par flex
                        paraissait donc décentrée vers le bas. */}
                    <Image
                        src="/textures/collection/button-home.png" alt="Menu"
                        width={28} height={28} unoptimized
                        className="-translate-y-1"
                        style={{ imageRendering: 'pixelated' }}
                    />
                </AssetButton>
            </div>

            {/* Titre : "Banner01a" du sheetinfo (le vrai ruban, plis en biais aux extrémités —
                pas Frame01a, un simple cadre droit). w-[1060px] = largeur du livre plus bas, pour
                que le ruban se centre par rapport au reste de la page. */}
            <div className="flex w-[1060px] flex-col items-center gap-1">
                <div className="travelbook-title-banner flex items-center justify-center px-12 py-6">
                    {/* Blanc + liseré noir (text-shadow 4 directions, comme les chiffres des
                        cartes) plutôt que le brun ink-text : illisible en trop grand sur le fond
                        crème/orangé du ruban. translateY(-10px) : le bandeau plat du ruban (où le
                        texte doit tenir) est mesuré plus haut que le centre géométrique de tout
                        le sprite — les pans repliés qui pendent en bas alourdissent le bas de
                        l'image sans faire partie de la zone de texte. */}
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
                        CARD COLLECTION
                    </h1>
                </div>
            </div>

            {/* Flèches en dehors du livre : plus de bouton (fond/cadre) — juste l'icône
                "Arrow01a" animée, quasi invisible sauf quand la souris s'approche du bord du
                livre (zone de survol large, PageArrow). Taille fixe du livre (largeur ET
                hauteur, pas de max-w responsive) : il ne doit jamais changer de dimensions en
                changeant d'onglet ou de page — agrandie d'un cran (820×1060 → 900×1160). */}
            <div className="flex h-[900px] items-stretch gap-1">
                <PageArrow direction="prev" onClick={goPrev} disabled={page === 0} />

                {/* Plus de cadre rouge séparé (.travelbook-cover) : chaque moitié
                    (.travelbook-page/.travelbook-page-right) est maintenant une image de carnet
                    autonome (bord extérieur + reliure spirale + remplissage crème inclus), donc
                    cette boîte n'est qu'un conteneur de mise en page à taille fixe. */}
                <div className="relative flex h-[900px] w-[1160px] flex-col">
                    {/* Onglets Cards/Card Backs sur le bord GAUCHE du livre (comme la preview du
                        pack) : pile verticale qui dépasse du bord, posée PAR-DESSUS la page (pas
                        cachée derrière la couverture) — z-index au-dessus de tout le reste du
                        livre, y compris la flèche de tournage de page (z-30, PageArrow). Léger
                        chevauchement (28px) pour rester bien collée au bord. */}
                    <div
                        className="absolute left-0 top-20 z-40 flex flex-col items-end gap-3"
                        style={{ transform: 'translateX(calc(-100% + 54px))' }}
                    >
                        <SideTab active={tab === 'cards'} onClick={() => setTab('cards')}>
                            <Image src="/textures/collection/icon-cards.png" alt="Cards" width={28} height={28} unoptimized style={{ imageRendering: 'pixelated' }} />
                        </SideTab>
                        <SideTab active={tab === 'backs'} onClick={() => setTab('backs')}>
                            <Image src="/textures/collection/icon-backs.png" alt="Card backs" width={32} height={32} unoptimized style={{ imageRendering: 'pixelated' }} />
                        </SideTab>
                    </div>

                    {/* Double page — remplit tout le fond du livre (plus de "grid-rows-2" qui
                        étirait les rangées et laissait un grand vide au milieu : les cartes
                        gardent leur taille naturelle, centrées dans tout l'espace disponible).
                        Chaque feuille a désormais son propre numéro de page en bas, comme un vrai
                        livre (numérotation continue gauche/droite, pas juste le numéro du
                        tournage de page) — chaque .travelbook-page devient donc une colonne
                        (grille des cartes + numéro), plus juste une grille brute. */}
                    <div className="flex flex-1 items-stretch gap-0.5 p-0.5">
                        <div className="travelbook-page relative flex flex-1 flex-col p-3">
                            {/* Recherche en haut de la page gauche, dans l'espace resté vide
                                au-dessus des cartes (à la place du mana, déplacé sur la page
                                droite — voir plus bas). */}
                            <div className={`flex h-9 items-center justify-center
                                ${tab !== 'cards' ? 'pointer-events-none opacity-30' : ''}`}
                            >
                                <SearchInput
                                    onChange={updateSearch}
                                    className="travelbook-slot w-full bg-transparent px-3 py-2 text-center font-serif text-xs text-ink-text
                                        placeholder:text-ink-muted/60 outline-none"
                                />
                            </div>
                            <div className="grid flex-1 content-center grid-cols-2 gap-x-4 gap-y-5">
                                {leftItems.map(renderSlot)}
                            </div>
                            {/* Tout en bas à GAUCHE, encore plus dans le coin qu'avant
                                (bottom-1/left-2 → bottom-0/left-1). */}
                            <p className="absolute bottom-0 left-1 font-serif text-3xl font-bold italic text-ink-text" style={boldNumberStyle}>
                                {page * 2 + 1}
                            </p>
                        </div>
                        <div className="travelbook-page travelbook-page-right relative flex flex-1 flex-col p-3">
                            {/* Nombre de cartes, sur le livre lui-même (pas sous la bannière du
                                titre) — de retour dans le coin haut-DROIT de la page droite (pas
                                haut-gauche comme le dernier essai), mais poussé plus dans le coin
                                qu'avant (top-1/right-2 → top-0/right-1). Pour l'onglet Cards :
                                cartes possédées / total de cartes existantes dans le jeu (pas le
                                nombre filtré par la recherche). */}
                            <p className="absolute right-1 top-0 font-serif text-xs italic text-ink-muted">
                                {tab === 'cards'
                                    ? `${cards.length} / ${totalCardCount} cards`
                                    : `${unlocked.size} / ${CARD_BACK_COUNT} unlocked`}
                            </p>
                            {/* Mana en haut de la page droite, dans l'espace resté vide au-dessus
                                des cartes (à la place des boutons de tri, retirés) — 7 éclairs
                                ("IconEnergy" du bouquin) qui se remplissent de 1 à 7 (plus
                                d'étoile pour le coût 0 : le premier éclair filtre aussi les
                                cartes à 0 mana, voir filteredCards). Cliquer sur N allume les
                                éclairs 1 à N, CELUI CLIQUÉ INCLUS (value <= costFilter, pas <).
                                Même hauteur fixe (h-9) que la recherche sur la page gauche, pour
                                que les deux grilles de cartes démarrent à la même hauteur. */}
                            <div className={`flex h-9 items-center justify-center gap-2
                                ${tab !== 'cards' ? 'pointer-events-none opacity-30' : ''}`}
                            >
                                {COST_FILTERS.map(value => {
                                    const filled = costFilter !== null && value <= costFilter
                                    const icon = `/textures/collection/icon-energy-${filled ? 'full' : 'empty'}.png`
                                    return (
                                        <button
                                            key={value}
                                            onClick={() => toggleCostFilter(value)}
                                            aria-pressed={costFilter === value}
                                            className="flex h-9 w-7 items-center justify-center transition-transform active:scale-90"
                                        >
                                            <Image
                                                src={icon}
                                                alt={`Cost ${value}`}
                                                width={12} height={14} unoptimized
                                                className="h-6 w-auto"
                                                style={{ imageRendering: 'pixelated' }}
                                            />
                                        </button>
                                    )
                                })}
                            </div>
                            <div className="grid flex-1 content-center grid-cols-2 gap-x-4 gap-y-5">
                                {rightItems.map(renderSlot)}
                            </div>
                            {/* Tout en bas à DROITE, symétrique de la page gauche. */}
                            <p className="absolute bottom-0 right-1 font-serif text-3xl font-bold italic text-ink-text" style={boldNumberStyle}>
                                {page * 2 + 2}
                            </p>
                        </div>
                    </div>
                </div>

                <PageArrow direction="next" onClick={goNext} disabled={page >= totalPages - 1} />
            </div>

            <CardZoom card={zoomedCard} onClose={() => setZoomedCard(null)} />
        </div>
    )
}
