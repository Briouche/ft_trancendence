'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'
import CardBackArt from '@/components/CardBackArt'
import { CARD_BACK_COUNT } from '@/lib/cardBacks'
import {
    Slot, PageArrow, SearchInput,
    HALF, SLOTS_PER_PAGE, normalize, parseCost, boldNumberStyle, woodenTableBackground, HomeButton, TitleBanner,
} from '@/components/notebook/NotebookUI'
import ScaleToFit from '@/components/ScaleToFit'
import CardZoom from './CardZoom'

type Card = CardFaceData & { ownedQty: number }
type Tab = 'cards' | 'backs'

const COST_FILTERS = [1, 2, 3, 4, 5, 6, 7]

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
    const [legendaryOnly, setLegendaryOnly] = useState(false)
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

        if (legendaryOnly) {
            matches = matches.filter(c => c.rarity === 'Légendaire')
        }

        // Plus de boutons de tri dans l'UI (retirés au profit du mana sur la page droite) :
        // tri fixé sur son réglage par défaut (coût croissant).
        return [...matches].sort((a, b) => parseCost(a.cost) - parseCost(b.cost))
    }, [cards, search, costFilter, legendaryOnly])

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

    function toggleLegendaryOnly() {
        setLegendaryOnly(v => !v)
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
        // Collection à la place du simple bg-ink-950 : le livre a l'air posé dessus.
        <div
            className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 md:p-10"
            style={woodenTableBackground}
        >
            <HomeButton onClick={() => router.push('/')} />

            {/* Bannière + livre dans un seul bloc à taille de conception fixe (comportement
                inchangé : dimensions internes en pixels, jamais retouchées selon l'onglet/page),
                que ScaleToFit ramène en un seul transform à la taille de la fenêtre — portrait
                1080×1920 compris. La bannière n'est donc plus `fixed` sur la fenêtre : elle doit
                rétrécir avec le livre, pas rester à sa taille desktop pendant qu'il rapetisse. */}
            <ScaleToFit>
                <div className="flex flex-col items-center gap-1">
                    <TitleBanner className="z-20">CARD COLLECTION</TitleBanner>

                    {/* Flèches en dehors du livre : plus de bouton (fond/cadre) — juste l'icône
                        "Arrow01a" animée, quasi invisible sauf quand la souris s'approche du bord
                        du livre (zone de survol large, PageArrow). Taille fixe du livre (largeur
                        ET hauteur, pas de responsive) : il ne doit jamais changer de dimensions en
                        changeant d'onglet ou de page — agrandie de 900×1160 à 990×1280. */}
                    <div className="relative z-10 flex h-[990px] items-stretch gap-1">
                        <PageArrow direction="prev" onClick={goPrev} disabled={page === 0} />

                {/* Plus de cadre rouge séparé (.travelbook-cover) : chaque moitié
                    (.travelbook-page/.travelbook-page-right) est maintenant une image de carnet
                    autonome (bord extérieur + reliure spirale + remplissage crème inclus), donc
                    cette boîte n'est qu'un conteneur de mise en page à taille fixe. */}
                <div className="relative flex h-[990px] w-[1280px] flex-col">
                    {/* Onglets Cards/Card Backs sur le bord GAUCHE du livre (comme la preview du
                        pack) : pile verticale qui dépasse du bord, posée PAR-DESSUS la page (pas
                        cachée derrière la couverture) — z-index au-dessus de tout le reste du
                        livre, y compris la flèche de tournage de page (z-30, PageArrow). Léger
                        chevauchement (28px) pour rester bien collée au bord. */}
                    <div
                        className="absolute left-0 top-20 z-40 flex flex-col items-end gap-3"
                        style={{ transform: 'translateX(calc(-100% + 54px))' }}
                    >
                        <SideTab active={tab === 'cards'} onClick={() => { setTab('cards'); setZoomedCard(null) }}>
                            <Image src="/textures/collection/icon-cards.png" alt="Cards" width={28} height={28} unoptimized style={{ imageRendering: 'pixelated' }} />
                        </SideTab>
                        <SideTab active={tab === 'backs'} onClick={() => { setTab('backs'); setZoomedCard(null) }}>
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
                                titre) — coin haut-droit de la page droite. Compte les doublons des
                                deux côtés (somme des ownedQty possédés / somme des qty de toutes
                                les cartes du jeu), pas juste le nombre de cartes uniques. Pour
                                l'onglet Cards : cartes possédées / total de cartes existantes dans
                                le jeu (pas le nombre filtré par la recherche). */}
                            <p className="absolute right-1 top-0 font-serif text-xs italic text-ink-muted">
                                {tab === 'cards'
                                    ? `${cards.reduce((sum, c) => sum + c.ownedQty, 0)} / ${totalCardCount} cards`
                                    : `${unlocked.size} / ${CARD_BACK_COUNT} unlocked`}
                            </p>
                            {/* Mana en haut de la page droite, dans l'espace resté vide au-dessus
                                des cartes (à la place des boutons de tri, retirés) — une étoile
                                (filtre légendaire uniquement) suivie de 7 éclairs ("IconEnergy" du
                                bouquin) qui se remplissent de 1 à 7 (le premier éclair filtre aussi
                                les cartes à 0 mana, voir filteredCards). Cliquer sur N allume les
                                éclairs 1 à N, CELUI CLIQUÉ INCLUS (value <= costFilter, pas <).
                                Même hauteur fixe (h-9) que la recherche sur la page gauche, pour
                                que les deux grilles de cartes démarrent à la même hauteur. */}
                            <div className={`flex h-9 items-center justify-center gap-2
                                ${tab !== 'cards' ? 'pointer-events-none opacity-30' : ''}`}
                            >
                                <button
                                    onClick={toggleLegendaryOnly}
                                    aria-pressed={legendaryOnly}
                                    className="flex h-9 w-7 items-center justify-center transition-transform active:scale-90"
                                >
                                    <Image
                                        src={`/textures/collection/icon-star-${legendaryOnly ? 'full' : 'empty'}.png`}
                                        alt="Legendary only"
                                        width={16} height={16} unoptimized
                                        className="h-6 w-auto"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                </button>
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
                </div>
            </ScaleToFit>

            <CardZoom card={zoomedCard} onClose={() => setZoomedCard(null)} />
        </div>
    )
}
