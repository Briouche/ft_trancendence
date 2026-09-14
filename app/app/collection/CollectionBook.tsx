'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'
import CardBackArt from '@/components/CardBackArt'
import { CARD_BACK_COUNT, ACHIEVEMENT_CARD_BACK_HINTS } from '@/lib/cardBacks'
import {
    Slot, PageArrow, SearchInput,
    HALF, SLOTS_PER_PAGE, normalize, parseCost, boldNumberStyle, woodenTableBackground, HomeButton,
} from '@/components/notebook/NotebookUI'
import ScaleToFit from '@/components/ScaleToFit'
import CardZoom from './CardZoom'

type Card = CardFaceData & { ownedQty: number }
type Tab = 'cards' | 'backs'

const COST_FILTERS = [1, 2, 3, 4, 5, 6, 7]

// Cards/Card Backs tabs stick out the book's left edge in a vertical, right-aligned stack, so
// their attached edge stays flush against the book at any width. Marker frames are mirrored (not
// rotated) and cropped to their real content to avoid a transparent gap. The active tab uses frame
// "open-3" rather than the largest one, since bigger frames fade to beige near the attached edge
// and stop meeting the page border cleanly.
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
                // Right-aligned stack: width grows from the RIGHT (attached) edge, so opening
                // looks like the tab sliding out of the book rather than swelling in place.
                width: active ? SIDE_TAB_OPEN_WIDTH : SIDE_TAB_CLOSED_WIDTH,
                height: SIDE_TAB_HEIGHT,
                backgroundImage: `url(/textures/notebook/marker-side/${active ? 'open-3' : 'open-1'}.webp)`,
                backgroundSize: '100% 100%',
                imageRendering: 'pixelated',
            }}
        >
            {/* Icon only visible on the active tab — like the pack preview, where closed tabs
                are plain empty pills, not just smaller ones. */}
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
    // Debounced by construction: SearchInput only bubbles the value up 150ms after the last
    // keystroke, so this component's large card grid doesn't re-render on every character typed —
    // the input field keeps its own local state to stay instant while typing.
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
            // No dedicated lightning bolt for cost 0 (the star icon was removed for this): the
            // first bolt ("1") also absorbs 0-mana cards, otherwise they'd be unfilterable.
            matches = costFilter === 1
                ? matches.filter(c => parseCost(c.cost) <= 1)
                : matches.filter(c => parseCost(c.cost) === costFilter)
        }

        if (legendaryOnly) {
            matches = matches.filter(c => c.rarity === 'Légendaire')
        }

        // No more sort buttons in the UI (removed in favor of the mana filter on the right page):
        // sort is fixed to its default (ascending cost).
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

    // Stable identity (useCallback): avoids restarting SearchInput's debounce effect on every
    // CollectionBook re-render.
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

    // Always pads to 6 (with `null`): the 3×2 grid stays full even at the end of the list.
    function padToHalf<T>(items: T[]): (T | null)[] {
        return [...items, ...Array(Math.max(0, HALF - items.length)).fill(null)]
    }

    const visibleItems: (Card | number)[] = tab === 'cards' ? visibleCards : visibleBacks
    const leftItems = padToHalf(visibleItems.slice(0, HALF))
    const rightItems = padToHalf(visibleItems.slice(HALF))

    function renderSlot(item: Card | number | null, slotIndex: number) {
        if (item === null) return <Slot key={`empty-${slotIndex}`} />
        if (typeof item === 'number') {
            const hint = ACHIEVEMENT_CARD_BACK_HINTS[item]
            return (
                <Slot key={item} onClick={() => chooseBack(item)} highlighted={item === cardBack}>
                    <CardBackArt
                        index={item}
                        className={`h-full w-full rounded-sm ${!unlocked.has(item) ? 'grayscale brightness-50' : ''}`}
                    />
                    {!unlocked.has(item) && (
                        <span className="group absolute inset-0 flex items-center justify-center">
                            <Image
                                src="/textures/collection/icon-locked.webp" alt="Locked" width={28} height={40} unoptimized
                                style={{ imageRendering: 'pixelated' }}
                                className="transition-opacity duration-150 group-hover:opacity-0"
                            />
                            {hint && (
                                <span
                                    className="pointer-events-none absolute inset-10 flex items-center justify-center rounded-md
                                        border border-parchment-100/30 bg-ink-950/95 p-1.5 text-center opacity-0 shadow-lg
                                        transition-opacity duration-150 group-hover:opacity-100"
                                >
                                    <span className="font-serif text-lg leading-snug text-parchment-100">
                                        {hint}
                                    </span>
                                </span>
                            )}
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
        // Wooden table background instead of the plain bg-ink-950: makes the book look like
        // it's sitting on top of it. h-screen + overflow-hidden (no padding, unlike the other
        // notebook pages): ScaleToFit below already centers/scales its content to fit the
        // viewport exactly — any padding added here on top of its own h-screen box would push
        // the total past 100vh and force the page to scroll to see the rest of the book.
        <div
            className="h-screen w-full overflow-hidden"
            style={woodenTableBackground}
        >
            <HomeButton onClick={() => router.push('/')} />

            {/* The book sits in one fixed-size block that ScaleToFit scales down to the window
                as a whole (portrait included). No title banner here (unlike Deck Builder's other
                notebook pages): removed so the book fits the viewport without scrolling. */}
            <ScaleToFit>
                <div className="flex flex-col items-center gap-1">
                    {/* Arrows sit outside the book with no button chrome — just the animated
                        "Arrow01a" icon, shown only when the mouse nears the book's edge (wide
                        hover zone, PageArrow). Book size is fixed so it never resizes when
                        switching tab/page. */}
                    <div className="relative z-10 flex h-200 items-stretch gap-1">
                        <PageArrow direction="prev" onClick={goPrev} disabled={page === 0} />

                {/* Each half (.travelbook-page/.travelbook-page-right) is a self-contained
                    notebook image (edge + spiral binding + cream fill), so this box is just a
                    fixed-size layout container, not a separate cover frame. */}
                <div className="relative flex h-200 w-260 flex-col">
                    {/* Tabs sit ON TOP of the page (not behind the cover), z-indexed above
                        everything else in the book including the page-turn arrow (z-30,
                        PageArrow), with a slight overlap to stay flush against the edge. */}
                    <div
                        className="absolute left-0 top-20 z-40 flex flex-col items-end gap-3"
                        style={{ transform: 'translateX(calc(-100% + 54px))' }}
                    >
                        <SideTab active={tab === 'cards'} onClick={() => { setTab('cards'); setZoomedCard(null) }}>
                            <Image src="/textures/collection/icon-cards.webp" alt="Cards" width={28} height={28} unoptimized style={{ imageRendering: 'pixelated' }} />
                        </SideTab>
                        <SideTab active={tab === 'backs'} onClick={() => { setTab('backs'); setZoomedCard(null) }}>
                            <Image src="/textures/collection/icon-backs.webp" alt="Card backs" width={32} height={32} unoptimized style={{ imageRendering: 'pixelated' }} />
                        </SideTab>
                    </div>

                    {/* Cards keep their natural size, centered in the available space, rather
                        than being stretched into rows. Each page has its own number at the
                        bottom, continuing left/right like a real book. */}
                    <div className="flex flex-1 items-stretch gap-0.5 p-0.5">
                        <div className="travelbook-page relative flex flex-1 flex-col p-3">
                            {/* Search sits at the top of the left page, in the space left empty
                                above the cards (mana moved to the right page instead — see
                                below). */}
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
                            {/* Bottom-LEFT corner, pushed further in than before
                                (bottom-1/left-2 → bottom-0/left-1). */}
                            <p className="absolute bottom-0 left-1 font-serif text-3xl font-bold italic text-ink-text" style={boldNumberStyle}>
                                {page * 2 + 1}
                            </p>
                        </div>
                        <div className="travelbook-page travelbook-page-right relative flex flex-1 flex-col p-3">
                            {/* Counts duplicates (sum of ownedQty), not unique cards — cards
                                owned / total cards existing in the game, unaffected by the
                                search filter. */}
                            <p className="absolute right-1 top-0 font-serif text-xs italic text-ink-muted">
                                {tab === 'cards'
                                    ? `${cards.reduce((sum, c) => sum + c.ownedQty, 0)} / ${totalCardCount} cards`
                                    : `${unlocked.size} / ${CARD_BACK_COUNT} unlocked`}
                            </p>
                            {/* Star = legendary-only filter; 7 bolts = cost filter, filled 1..N
                                INCLUDING the clicked one (value <= costFilter). First bolt also
                                covers 0-mana cards (see filteredCards). */}
                            <div className={`flex h-9 items-center justify-center gap-2
                                ${tab !== 'cards' ? 'pointer-events-none opacity-30' : ''}`}
                            >
                                <button
                                    onClick={toggleLegendaryOnly}
                                    aria-pressed={legendaryOnly}
                                    className="flex h-9 w-7 items-center justify-center transition-transform active:scale-90"
                                >
                                    <Image
                                        src={`/textures/collection/icon-star-${legendaryOnly ? 'full' : 'empty'}.webp`}
                                        alt="Legendary only"
                                        width={16} height={16} unoptimized
                                        className="h-6 w-auto"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                </button>
                                {COST_FILTERS.map(value => {
                                    const filled = costFilter !== null && value <= costFilter
                                    const icon = `/textures/collection/icon-energy-${filled ? 'full' : 'empty'}.webp`
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
                            {/* Bottom-RIGHT corner, mirroring the left page. */}
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
