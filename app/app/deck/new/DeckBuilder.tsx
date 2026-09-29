'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'
import ScaleToFit from '@/components/ScaleToFit'
import {
    Slot, PageArrow, SearchInput, SelectHighlight, NotebookScrollArea,
    HALF, SLOTS_PER_PAGE, normalize, parseCost, boldNumberStyle, outlinedWhiteTextStyle, woodenTableBackground,
} from '@/components/notebook/NotebookUI'
import { LEGENDARY_RARITY, MAX_LEGENDARY, MAX_NON_LEGENDARY } from '@/lib/deckRules'
import { DECK_NAME_MAX_LENGTH } from '@/lib/validation'
import { HomeButton } from '@/components/notebook/AssetButton'
import BoxedButton from '@/components/notebook/BoxedButton'

type Card = CardFaceData & { qty: number }
type DeckEntry = { card: Card; qty: number }
type SavedDeck = { id: number; name: string; cards: { qty: number; card: { rarity: string; legendId: string } }[] }

const COST_FILTERS = [1, 2, 3, 4, 5, 6, 7]

type Props = {
    cards: Card[]
    decks: SavedDeck[]
    totalCardCount: number
    deckId?: number
    initialName?: string
    initialDeck?: Record<string, DeckEntry>
}

/**
 * Notebook of the player's collection (left) next to the deck being built and the list of
 * saved decks (right). Left-click adds a card, right-click removes it.
 */
export default function DeckBuilder({ cards, decks, totalCardCount, deckId, initialName = '', initialDeck = {} }: Props) {
    const router = useRouter()
    const [deck, setDeck]             = useState<Record<string, DeckEntry>>(initialDeck)
    const [deckName, setDeckName]     = useState(initialName)
    const [saving, setSaving]         = useState(false)
    const [message, setMessage]       = useState('')
    const [search, setSearch]         = useState('')
    const [costFilter, setCostFilter] = useState<number | null>(null)
    const [legendaryOnly, setLegendaryOnly] = useState(false)
    const [page, setPage]             = useState(0)
    const [creating, setCreating]     = useState(!!deckId)
    const [deletingDeckId, setDeletingDeckId] = useState<number | null>(null)
    const [hoveredDeckId, setHoveredDeckId] = useState<number | null>(null)
    const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null)

    // Cost filter 1 also covers 0-mana cards.
    const filteredCards = useMemo(() => {
        const query = normalize(search.trim())
        let matches = query === ''
            ? cards
            : cards.filter(c => normalize(c.name).includes(query) || normalize(c.desc).includes(query))

        if (costFilter !== null) {
            matches = costFilter === 1
                ? matches.filter(c => parseCost(c.cost) <= 1)
                : matches.filter(c => parseCost(c.cost) === costFilter)
        }

        if (legendaryOnly) {
            matches = matches.filter(c => c.rarity === LEGENDARY_RARITY)
        }

        return [...matches].sort((a, b) => parseCost(a.cost) - parseCost(b.cost))
    }, [cards, search, costFilter, legendaryOnly])

    const totalPages = Math.max(1, Math.ceil(filteredCards.length / SLOTS_PER_PAGE))
    const currentPage = Math.min(page, totalPages - 1)
    const visibleCards = filteredCards.slice(currentPage * SLOTS_PER_PAGE, currentPage * SLOTS_PER_PAGE + SLOTS_PER_PAGE)

    function padToHalf<T>(items: T[]): (T | null)[] {
        return [...items, ...Array(Math.max(0, HALF - items.length)).fill(null)]
    }
    const leftItems  = padToHalf(visibleCards.slice(0, HALF))
    const rightItems = padToHalf(visibleCards.slice(HALF))

    const updateSearch = useCallback((value: string) => {
        setSearch(value)
        setPage(0)
    }, [])

    function toggleCostFilter(value: number) {
        setCostFilter(f => f === value ? null : value)
        setPage(0)
    }

    function toggleLegendaryOnly() {
        setLegendaryOnly(v => !v)
        setPage(0)
    }

    const sortedDeckEntries = useMemo(
        () => Object.values(deck).sort((a, b) => {
            const aLegendary = a.card.rarity === LEGENDARY_RARITY
            const bLegendary = b.card.rarity === LEGENDARY_RARITY
            if (aLegendary !== bLegendary) return aLegendary ? -1 : 1
            return parseCost(a.card.cost) - parseCost(b.card.cost)
        }),
        [deck],
    )

    const legendaryCount = Object.values(deck)
        .filter(e => e.card.rarity === LEGENDARY_RARITY)
        .reduce((sum, e) => sum + e.qty, 0)
    const commonCount = Object.values(deck)
        .filter(e => e.card.rarity !== LEGENDARY_RARITY)
        .reduce((sum, e) => sum + e.qty, 0)
    const totalCards = legendaryCount + commonCount

    function canAdd(card: Card): boolean {
        const inDeck = deck[card.id]?.qty ?? 0
        if (inDeck >= card.qty) return false
        if (card.rarity === LEGENDARY_RARITY) return legendaryCount < MAX_LEGENDARY
        return commonCount < MAX_NON_LEGENDARY
    }

    function addCard(card: Card) {
        if (!canAdd(card)) return
        if (!creating) setCreating(true)
        setDeck(prev => ({ ...prev, [card.id]: { card, qty: (prev[card.id]?.qty ?? 0) + 1 } }))
    }

    function removeCard(card: Card) {
        setDeck(prev => {
            const entry = prev[card.id]
            if (!entry) return prev
            if (entry.qty <= 1) {
                const next = { ...prev }
                delete next[card.id]
                return next
            }
            return { ...prev, [card.id]: { ...entry, qty: entry.qty - 1 } }
        })
    }

    async function saveDeck() {
        if (!deckName.trim()) { setMessage('Give your deck a name'); return }
        if (totalCards === 0) { setMessage('Add cards to your deck'); return }

        setSaving(true)
        setMessage('')

        const url    = deckId ? `/api/decks/${deckId}` : '/api/decks'
        const method = deckId ? 'PUT' : 'POST'

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name:  deckName,
                cards: Object.values(deck).map(e => ({ cardId: e.card.id, qty: e.qty })),
            }),
        })

        setSaving(false)
        if (res.ok) {
            const saved = await res.json()
            setMessage('Deck saved!')
            if (!deckId) router.push(`/deck/${saved.id}`)
        } else {
            const body: { error?: string } | null = await res.json().catch(() => null)
            setMessage(body?.error ?? 'Error while saving')
        }
    }

    async function deleteDeck(id: number) {
        setDeletingDeckId(id)
        const res = await fetch(`/api/decks/${id}`, { method: 'DELETE' })
        setDeletingDeckId(null)
        if (res.ok && deckId === id) router.push('/deck/new')
        else router.refresh()
    }

    function renderSlot(card: Card | null, slotIndex: number) {
        if (card === null) return <Slot key={`empty-${slotIndex}`} />
        const inDeck = deck[card.id]?.qty ?? 0
        const blocked = !canAdd(card)
        return (
            <Slot
                key={card.id}
                onClick={() => addCard(card)}
                onContextMenu={inDeck > 0 ? () => removeCard(card) : undefined}
                disabled={blocked}
            >
                <ScaledCardFace
                    card={card}
                    stackQty={card.qty}
                    dimBack={inDeck >= 1 || blocked}
                    dimFront={inDeck >= 2 || blocked}
                />
            </Slot>
        )
    }

    return (
        <div
            className="h-screen w-full overflow-hidden"
            style={woodenTableBackground}
        >
            <HomeButton onClick={() => router.push('/')} />

            <ScaleToFit>
                <div className="flex flex-col items-center gap-1 pr-28">
                    <div className="flex h-200 items-stretch gap-4">
                        <PageArrow direction="prev" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} />

                <div className="relative flex h-200 w-260 flex-col">
                    <div className="flex flex-1 items-stretch gap-0.5 p-0.5">
                        <div className="travelbook-page relative flex flex-1 flex-col p-3">
                            <div className="flex h-9 items-center justify-center">
                                <SearchInput
                                    onChange={updateSearch}
                                    className="travelbook-slot w-full bg-transparent px-3 py-2 text-center font-serif text-xs text-ink-text
                                        placeholder:text-ink-muted/60 outline-none"
                                />
                            </div>
                            <div className="grid flex-1 content-center grid-cols-2 gap-x-4 gap-y-5">
                                {leftItems.map(renderSlot)}
                            </div>
                            <p className="absolute bottom-0 left-1 font-serif text-3xl font-bold italic text-ink-text" style={boldNumberStyle}>
                                {currentPage * 2 + 1}
                            </p>
                        </div>
                        <div className="travelbook-page travelbook-page-right relative flex flex-1 flex-col p-3">
                            <p className="absolute right-1 top-0 font-serif text-xs italic text-ink-muted">
                                {cards.reduce((sum, c) => sum + c.qty, 0)} / {totalCardCount} cards
                            </p>
                            <div className="flex h-9 items-center justify-center gap-2">
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
                            <p className="absolute bottom-0 right-1 font-serif text-3xl font-bold italic text-ink-text" style={boldNumberStyle}>
                                {currentPage * 2 + 2}
                            </p>
                        </div>
                    </div>
                </div>

                <PageArrow direction="next" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} />

                <div className="travelbook-frame4-panel relative z-30 flex h-200 w-80 flex-col p-5">
                    {creating ? (
                        <>
                            <div className="relative mb-3 flex items-center justify-center">
                                <button
                                    onClick={() => {
                                        if (deckId) { router.push('/deck/new'); return }
                                        setDeck({})
                                        setCreating(false)
                                    }}
                                    className="absolute left-0 shrink-0 transition-opacity hover:opacity-70"
                                >
                                    <Image
                                        src="/textures/notebook/arrow/Arrow2.webp"
                                        alt="Back"
                                        width={10} height={6} unoptimized
                                        className="h-8 w-auto"
                                        style={{ imageRendering: 'pixelated' }}
                                    />
                                </button>

                                <p className="text-center font-display text-3xl font-bold text-white" style={outlinedWhiteTextStyle}>
                                    {deckId ? 'Edit deck' : 'New deck'}
                                </p>
                            </div>

                            <input
                                type="text"
                                placeholder="Deck name…"
                                value={deckName}
                                onChange={e => setDeckName(e.target.value)}
                                maxLength={DECK_NAME_MAX_LENGTH}
                                className="travelbook-slot mb-3 w-full bg-transparent px-3 py-2 text-center font-serif text-base
                                    text-ink-text placeholder:text-ink-muted/60 outline-none"
                            />

                            <p className="mb-1 text-center font-serif text-xs text-ink-muted">
                                {legendaryCount}/{MAX_LEGENDARY} legendary · {commonCount}/{MAX_NON_LEGENDARY} normal cards
                            </p>
                            <p className="mb-3 text-center font-serif text-xs text-ink-muted">
                                {totalCards} / {MAX_LEGENDARY + MAX_NON_LEGENDARY} cards
                            </p>

                            {message && (
                                <p className="mb-3 text-center font-serif text-xs italic text-ink-text">{message}</p>
                            )}

                            <BoxedButton onClick={saveDeck} disabled={saving || totalCards === 0} className="mb-5 h-11 w-full">
                                {saving ? 'Saving…' : 'Save deck'}
                            </BoxedButton>

                            <div className="mb-2 h-px bg-ink-900/15" />
                            <p className="mb-2 text-center font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">
                                Cards in deck
                            </p>

                            <NotebookScrollArea className="-mr-6 flex-1">
                                {totalCards === 0 && (
                                    <p className="mt-6 text-center font-serif text-xs text-ink-muted/70">No cards added yet</p>
                                )}
                                {sortedDeckEntries.map(entry => (
                                    <div
                                        key={entry.card.id}
                                        className="mb-1.5 flex items-center rounded-sm px-2 py-1.5"
                                    >
                                        <button
                                            onClick={() => removeCard(entry.card)}
                                            className="flex min-w-0 items-center gap-2.5 text-left"
                                        >
                                            <span className="shrink-0 font-serif text-xs text-ink-muted">×{entry.qty}</span>
                                            <span className="flex shrink-0 items-center gap-1.5">
                                                <Image
                                                    src="/textures/collection/icon-energy-full.webp"
                                                    alt=""
                                                    width={12} height={14} unoptimized
                                                    className="h-4 w-auto"
                                                    style={{ imageRendering: 'pixelated' }}
                                                />
                                                <span className="font-serif text-base text-ink-text">
                                                    {entry.card.cost}
                                                </span>
                                            </span>
                                            <p className="truncate font-serif text-lg text-ink-text">{entry.card.name}</p>
                                            {entry.card.rarity === LEGENDARY_RARITY && (
                                                <Image
                                                    src="/textures/collection/icon-star-full.webp"
                                                    alt="Legendary"
                                                    width={16} height={16} unoptimized
                                                    className="h-4 w-auto shrink-0"
                                                    style={{ imageRendering: 'pixelated' }}
                                                />
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </NotebookScrollArea>
                        </>
                    ) : (
                        <>
                            <p className="mb-3 text-center font-display text-4xl font-bold text-white" style={outlinedWhiteTextStyle}>
                                My decks
                            </p>

                            <NotebookScrollArea className="-mr-6 flex-1">
                                {decks.length === 0 && (
                                    <p className="mt-6 text-center font-serif text-xs text-white/70" style={outlinedWhiteTextStyle}>No decks yet</p>
                                )}
                                {decks.map(d => {
                                    const legendaryCards = d.cards.filter(c => c.card.rarity === LEGENDARY_RARITY)
                                    return (
                                        <div
                                            key={d.id}
                                            role="button"
                                            tabIndex={0}
                                            onClick={() => router.push(`/deck/${d.id}`)}
                                            onKeyDown={e => { if (e.key === 'Enter') router.push(`/deck/${d.id}`) }}
                                            onMouseEnter={() => setHoveredDeckId(d.id)}
                                            onMouseLeave={() => setHoveredDeckId(null)}
                                            className="travelbook-deck-frame relative mb-2 flex w-full cursor-pointer items-center gap-2 px-2 py-2"
                                        >
                                            {hoveredDeckId === d.id && <SelectHighlight className="inset-0 z-10" animate={false} />}
                                            {legendaryCards.length > 0 && (
                                                <span className="travelbook-slot ml-4 flex h-12 w-12 shrink-0 items-center justify-center">
                                                    {legendaryCards.map((c, i) => (
                                                        <Image
                                                            key={i}
                                                            src={`/textures/collection/icon-leg-${c.card.legendId}.webp`}
                                                            alt="Legendary"
                                                            width={32} height={34} unoptimized
                                                            className="h-9 w-auto"
                                                            style={{ imageRendering: 'pixelated' }}
                                                        />
                                                    ))}
                                                </span>
                                            )}
                                            <p className="min-w-0 flex-1 truncate text-center font-serif text-lg text-ink-text">
                                                {d.name}
                                            </p>
                                            <button
                                                onClick={e => { e.stopPropagation(); setPendingDelete({ id: d.id, name: d.name }) }}
                                                disabled={deletingDeckId === d.id}
                                                className="relative z-20 mr-4 shrink-0 transition-opacity hover:opacity-70 disabled:opacity-30"
                                            >
                                                <Image
                                                    src="/textures/notebook/icon-cross.webp"
                                                    alt="Delete deck"
                                                    width={15} height={15} unoptimized
                                                    className="h-4 w-auto"
                                                    style={{ imageRendering: 'pixelated' }}
                                                />
                                            </button>
                                        </div>
                                    )
                                })}
                            </NotebookScrollArea>

                            <BoxedButton onClick={() => setCreating(true)} className="mt-4 h-14 w-full text-lg">
                                Create deck
                            </BoxedButton>
                        </>
                    )}
                        </div>
                    </div>
                </div>
            </ScaleToFit>

            {pendingDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm"
                    onClick={() => setPendingDelete(null)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="travelbook-deck-frame flex w-120 flex-col items-center gap-6 p-10"
                    >
                        <p className="text-center font-display text-3xl font-bold text-ink-text">
                            Delete deck?
                        </p>
                        <p className="text-center font-serif text-lg text-ink-muted">
                            “{pendingDelete.name}” will be permanently deleted.
                        </p>
                        <div className="flex w-full gap-4">
                            <BoxedButton onClick={() => setPendingDelete(null)} tone="ink" className="h-14 flex-1 text-lg">
                                Cancel
                            </BoxedButton>
                            <BoxedButton
                                onClick={() => {
                                    const { id } = pendingDelete
                                    setPendingDelete(null)
                                    deleteDeck(id)
                                }}
                                className="h-14 flex-1 text-lg"
                            >
                                Delete
                            </BoxedButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
