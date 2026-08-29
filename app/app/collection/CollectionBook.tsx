'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'
import CardBackArt from '@/components/CardBackArt'
import { CARD_BACK_COUNT } from '@/lib/cardBacks'
import CardZoom from './CardZoom'

// Boucle sur `count` frames toutes les `intervalMs`, tant que `playing` est vrai (retombe sur la
// frame 1 sinon) — utilisé pour toutes les animations "Sprites Animated" du carnet (sélection,
// flèches) qui doivent boucler en continu plutôt que jouer une fois.
function useLoopFrame(count: number, intervalMs: number, playing: boolean): number {
    const [frame, setFrame] = useState(1)
    useEffect(() => {
        if (!playing) return
        const id = setInterval(() => setFrame(f => (f % count) + 1), intervalMs)
        // Le reset à la frame 1 se fait dans le cleanup (pas dans le corps de l'effet) : appeler
        // setState directement dans le corps déclenche des rendus en cascade (règle
        // react-hooks/set-state-in-effect) — le cleanup s'exécute déjà à chaque fois que
        // `playing` repasse à false ou que le composant démonte, donc c'est équivalent.
        return () => { clearInterval(id); setFrame(1) }
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

const COST_FILTERS = [0, 1, 2, 3, 4, 5, 6, 7]

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
                    {(hovered || highlighted) && <SelectHighlight className="-inset-2 z-10" animate={hovered} />}
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

// Bouton générique "marqueur" — au clic, se lève (Marker01a_Open, 6 frames) puis se rabaisse
// (Marker01a_Close, 6 frames), un aller-retour complet en guise de retour visuel, pas un état
// persistant "ouvert" tant qu'actif. Au repos, la frame 1 du marqueur (la plus refermée) sert de
// case fixe — plus aucun "Frame" statique nulle part sur ce bouton, uniquement le sprite marqueur,
// animé ou non. Un translateY accompagne les frames pour un vrai mouvement de levée/abaissement,
// pas juste un changement de texture dans une boîte immobile.
const MARKER_STEP_MS = 30
const MARKER_LIFT_PX = 6

function MarkerButton({ onClick, className = '', children }: {
    onClick: () => void
    className?: string
    children: React.ReactNode
}) {
    const [frame, setFrame] = useState(0) // 0 = repos (= frame "open-1") ; 1-6 = lève ; 7-12 = rabaisse

    function handleClick() {
        onClick()
        let i = 1
        const interval = setInterval(() => {
            setFrame(i)
            i += 1
            if (i > 12) { clearInterval(interval); setFrame(0) }
        }, MARKER_STEP_MS)
    }

    const resting = frame === 0
    const rising = frame >= 1 && frame <= 6
    const lift = resting ? 0 : rising ? -(frame / 6) * MARKER_LIFT_PX : -((12 - frame + 1) / 6) * MARKER_LIFT_PX
    const markerSrc = resting ? 'open-1' : rising ? `open-${frame}` : `close-${frame - 6}`

    return (
        <button
            onClick={handleClick}
            className={`flex items-center justify-center ${className}`}
            style={{
                transform: `translateY(${lift}px)`,
                borderStyle: 'solid',
                borderWidth: '8px 8px 0 8px',
                borderImageSource: `url(/textures/notebook/marker/${markerSrc}.png)`,
                borderImageSlice: '8 8 0 8 fill',
                borderImageWidth: '8px 8px 0 8px',
                borderImageRepeat: 'stretch',
                imageRendering: 'pixelated',
            }}
        >
            {children}
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

export default function CollectionBook({ cards, initialCardBack, unlockedCardBacks }: {
    cards: Card[]
    initialCardBack: number
    unlockedCardBacks: number[]
}) {
    const router = useRouter()
    const [tab, setTab] = useState<Tab>('cards')
    const [search, setSearch] = useState('')
    const [sortBy, setSortBy] = useState<'cost' | 'name'>('cost')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
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
            : cards.filter(c => normalize(c.name).includes(query) || normalize(c.desc).includes(query))

        if (costFilter !== null) {
            matches = matches.filter(c => parseCost(c.cost) === costFilter)
        }

        return [...matches].sort((a, b) => {
            if (sortBy === 'name') {
                return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
            }
            return sortDir === 'asc' ? parseCost(a.cost) - parseCost(b.cost) : parseCost(b.cost) - parseCost(a.cost)
        })
    }, [cards, search, sortBy, sortDir, costFilter])

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

    function updateSearch(value: string) {
        setSearch(value)
        setCardsPage(0)
    }

    // Recliquer le même critère inverse juste sa direction ; changer de critère repart en asc.
    function selectSort(criteria: 'cost' | 'name') {
        if (sortBy === criteria) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(criteria)
            setSortDir('asc')
        }
        setCardsPage(0)
    }

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
                        <span className="absolute inset-0 flex items-center justify-center text-lg">🔒</span>
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
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-ink-950 p-4 md:p-10">
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

            {/* Plus de panneau latéral : recherche en haut-gauche, tri en haut-droite (une
                rangée à la largeur du livre, juste au-dessus), mana en rangée horizontale sous le
                livre (voir plus bas) — désactivés (pas retirés, pour ne pas faire varier la
                disposition) hors de l'onglet Cards. */}
            <div className={`flex w-[1160px] items-center justify-between
                ${tab !== 'cards' ? 'pointer-events-none opacity-30' : ''}`}
            >
                <input
                    type="text"
                    value={search}
                    onChange={e => updateSearch(e.target.value)}
                    placeholder="Search a name or an effect…"
                    className="travelbook-slot w-64 bg-transparent px-3 py-2 font-serif text-xs text-ink-text
                        placeholder:text-ink-muted/60 outline-none"
                />
                <div className="flex gap-2">
                    <AssetButton onClick={() => selectSort('cost')} className="h-9 w-24 text-xs">
                        ◆ Cost {sortBy === 'cost' && (sortDir === 'asc' ? '↑' : '↓')}
                    </AssetButton>
                    <AssetButton onClick={() => selectSort('name')} className="h-9 w-24 text-xs">
                        A–Z {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                    </AssetButton>
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
                <div className="flex h-[900px] w-[1160px] flex-col">
                    {/* Onglets Cards/Card Backs, à cheval sur le bord du livre — case fermée au
                        repos, se lève puis se rabaisse au clic (voir MarkerButton). Décalés vers
                        la droite (pl-6 au lieu de px-2) pour ne pas coller au bord du livre. */}
                    <div className="relative z-10 -mb-8 flex gap-2 pl-6 pr-2">
                        <MarkerButton onClick={() => setTab('cards')} className={tab === 'cards' ? 'h-12 w-14' : 'h-10 w-14 self-end opacity-80'}>
                            <Image src="/textures/collection/icon-cards.png" alt="Cards" width={16} height={16} unoptimized style={{ imageRendering: 'pixelated' }} />
                        </MarkerButton>
                        <MarkerButton onClick={() => setTab('backs')} className={tab === 'backs' ? 'h-12 w-14' : 'h-10 w-14 self-end opacity-80'}>
                            <Image src="/textures/collection/icon-backs.png" alt="Card backs" width={18} height={18} unoptimized style={{ imageRendering: 'pixelated' }} />
                        </MarkerButton>
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
                            <div className="grid flex-1 content-center grid-cols-2 gap-x-4 gap-y-5">
                                {leftItems.map(renderSlot)}
                            </div>
                            {/* Tout en bas à GAUCHE, dans le coin de la page (absolute, pas dans
                                le flux) — plus grand qu'avant, comme le folio extérieur d'un vrai
                                livre. */}
                            <p className="absolute bottom-1 left-2 font-serif text-3xl font-bold italic text-ink-text" style={boldNumberStyle}>
                                {page * 2 + 1}
                            </p>
                        </div>
                        <div className="travelbook-page travelbook-page-right relative flex flex-1 flex-col p-3">
                            {/* Nombre de cartes, sur le livre lui-même (pas sous la bannière du
                                titre) — dans le coin haut-droit de la page droite, à l'intérieur
                                de sa marge (pas collé au bord du livre comme un premier essai qui
                                finissait à moitié caché sous la reliure/le cadre). */}
                            <p className="absolute right-2 top-1 font-serif text-xs italic text-ink-muted">
                                {tab === 'cards'
                                    ? `${filteredCards.length} card${filteredCards.length !== 1 ? 's' : ''}`
                                    : `${unlocked.size} / ${CARD_BACK_COUNT} unlocked`}
                            </p>
                            <div className="grid flex-1 content-center grid-cols-2 gap-x-4 gap-y-5">
                                {rightItems.map(renderSlot)}
                            </div>
                            {/* Tout en bas à DROITE, symétrique de la page gauche. */}
                            <p className="absolute bottom-1 right-2 font-serif text-3xl font-bold italic text-ink-text" style={boldNumberStyle}>
                                {page * 2 + 2}
                            </p>
                        </div>
                    </div>
                </div>

                <PageArrow direction="next" onClick={goNext} disabled={page >= totalPages - 1} />
            </div>

            {/* Mana en rangée horizontale sous le livre — des éclairs ("IconEnergy" du bouquin,
                pas d'icône équivalente dans le carnet) qui se remplissent de 0 à 7. Boutons
                simples, pas de marqueur animé (cette animation reste réservée aux onglets
                Cards/Card Backs). */}
            <div className={`flex items-center gap-2 ${tab !== 'cards' ? 'pointer-events-none opacity-30' : ''}`}>
                {COST_FILTERS.map(value => {
                    const filled = costFilter !== null && value < costFilter
                    return (
                        <button
                            key={value}
                            onClick={() => toggleCostFilter(value)}
                            aria-pressed={costFilter === value}
                            className="flex h-10 w-8 items-center justify-center transition-transform active:scale-90"
                        >
                            <Image
                                src={`/textures/collection/icon-energy-${filled ? 'full' : 'empty'}.png`}
                                alt={`Cost ${value}`}
                                width={12} height={14} unoptimized
                                className="h-7 w-auto"
                                style={{ imageRendering: 'pixelated' }}
                            />
                        </button>
                    )
                })}
            </div>

            <CardZoom card={zoomedCard} onClose={() => setZoomedCard(null)} />
        </div>
    )
}
