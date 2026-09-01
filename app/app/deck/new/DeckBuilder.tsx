'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'
import {
    Slot, AssetButton, PageArrow, SearchInput,
    HALF, SLOTS_PER_PAGE, normalize, parseCost, boldNumberStyle, woodenTableBackground, HomeButton, TitleBanner,
} from '@/components/notebook/NotebookUI'

type Card = CardFaceData & { qty: number }
type DeckEntry = { card: Card; qty: number }
type SavedDeck = { id: number; name: string; cards: { qty: number }[] }

const MAX_LEGENDARY = 1
const MAX_COMMONS = 20
const COST_FILTERS = [1, 2, 3, 4, 5, 6, 7]

type Props = {
    cards: Card[]
    decks: SavedDeck[]
    deckId?: number
    initialName?: string
    initialDeck?: Record<string, DeckEntry>
}

export default function DeckBuilder({ cards, decks, deckId, initialName = '', initialDeck = {} }: Props) {
    const router = useRouter()
    const [deck, setDeck]             = useState<Record<string, DeckEntry>>(initialDeck)
    const [deckName, setDeckName]     = useState(initialName)
    const [saving, setSaving]         = useState(false)
    const [message, setMessage]       = useState('')
    const [search, setSearch]         = useState('')
    const [costFilter, setCostFilter] = useState<number | null>(null)
    const [page, setPage]             = useState(0)

    const filteredCards = useMemo(() => {
        const query = normalize(search.trim())
        let matches = query === ''
            ? cards
            : cards.filter(c => normalize(c.name).includes(query) || normalize(c.desc).includes(query))

        if (costFilter !== null) {
            // Même règle que la Collection : le premier éclair (coût 1) absorbe aussi le coût 0,
            // pas d'éclair dédié pour ce dernier.
            matches = costFilter === 1
                ? matches.filter(c => parseCost(c.cost) <= 1)
                : matches.filter(c => parseCost(c.cost) === costFilter)
        }

        return [...matches].sort((a, b) => parseCost(a.cost) - parseCost(b.cost))
    }, [cards, search, costFilter])

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

    const legendaryCount = Object.values(deck)
        .filter(e => e.card.rarity === 'Légendaire')
        .reduce((sum, e) => sum + e.qty, 0)
    const commonCount = Object.values(deck)
        .filter(e => e.card.rarity !== 'Légendaire')
        .reduce((sum, e) => sum + e.qty, 0)
    const totalCards = legendaryCount + commonCount

    function canAdd(card: Card): boolean {
        const inDeck = deck[card.id]?.qty ?? 0
        if (inDeck >= card.qty) return false
        if (card.rarity === 'Légendaire') return legendaryCount < MAX_LEGENDARY
        return commonCount < MAX_COMMONS
    }

    function addCard(card: Card) {
        if (!canAdd(card)) return
        setDeck(prev => ({ ...prev, [card.id]: { card, qty: (prev[card.id]?.qty ?? 0) + 1 } }))
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
            setMessage('Error while saving')
        }
    }

    function renderSlot(card: Card | null, slotIndex: number) {
        if (card === null) return <Slot key={`empty-${slotIndex}`} />
        const inDeck = deck[card.id]?.qty ?? 0
        return (
            <Slot key={card.id} onClick={() => addCard(card)} disabled={!canAdd(card)}>
                {inDeck > 0 && (
                    <span className="absolute -left-2 -top-2 z-20 flex h-7 w-7 items-center justify-center
                        rounded-full border-2 border-parchment-50 bg-gold-500 font-display text-xs
                        font-bold text-ink-950 shadow">
                        {inDeck}
                    </span>
                )}
                <ScaledCardFace card={card} />
            </Slot>
        )
    }

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 md:p-10"
            style={woodenTableBackground}
        >
            <HomeButton onClick={() => router.push('/')} />
            <TitleBanner>DECK BUILDER</TitleBanner>

            <div className="flex h-[900px] items-stretch gap-4">
                {/* Parchemin : le deck en cours d'édition (nom, stats, sauvegarde) en haut, la
                    liste de tous les decks du joueur en dessous — même papier que les pages du
                    livre (.travelbook-page), pour rester dans le même carnet plutôt qu'un panneau
                    à part. */}
                <div className="travelbook-page relative flex w-72 flex-col p-5">
                    <p className="mb-3 text-center font-display text-lg font-bold text-ink-text">
                        {deckId ? 'Edit deck' : 'New deck'}
                    </p>

                    <input
                        type="text"
                        placeholder="Deck name…"
                        value={deckName}
                        onChange={e => setDeckName(e.target.value)}
                        className="travelbook-slot mb-3 w-full bg-transparent px-3 py-2 text-center font-serif text-xs
                            text-ink-text placeholder:text-ink-muted/60 outline-none"
                    />

                    <p className="mb-1 text-center font-serif text-xs text-ink-muted">
                        {legendaryCount}/{MAX_LEGENDARY} legendary · {commonCount}/{MAX_COMMONS} common
                    </p>
                    <p className="mb-3 text-center font-serif text-xs text-ink-muted">
                        {totalCards} / {MAX_LEGENDARY + MAX_COMMONS} cards
                    </p>

                    {message && (
                        <p className="mb-3 text-center font-serif text-xs italic text-ink-text">{message}</p>
                    )}

                    <AssetButton onClick={saveDeck} disabled={saving || totalCards === 0} className="mb-5 h-11 w-full">
                        {saving ? 'Saving…' : 'Save deck'}
                    </AssetButton>

                    <div className="mb-2 h-px bg-ink-900/15" />
                    <p className="mb-2 text-center font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">
                        My decks
                    </p>

                    <div className="flex-1 overflow-y-auto">
                        {decks.length === 0 && (
                            <p className="mt-6 text-center font-serif text-xs text-ink-muted/70">No decks yet</p>
                        )}
                        {decks.map(d => {
                            const count = d.cards.reduce((sum, c) => sum + c.qty, 0)
                            const active = d.id === deckId
                            return (
                                <button
                                    key={d.id}
                                    onClick={() => router.push(`/deck/${d.id}`)}
                                    className={`mb-1.5 block w-full rounded-sm px-2 py-1.5 text-left transition-colors
                                        ${active ? 'bg-ink-900/10' : 'hover:bg-ink-900/5'}`}
                                >
                                    <p className="truncate font-serif text-sm text-ink-text">{d.name}</p>
                                    <p className="font-serif text-xs text-ink-muted">{count} cards</p>
                                </button>
                            )
                        })}
                    </div>

                    <AssetButton onClick={() => router.push('/deck/new')} className="mt-3 h-10 w-full">
                        + Create deck
                    </AssetButton>
                </div>

                <PageArrow direction="prev" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} />

                {/* Livre : mêmes pages/cases que la Collection (voir NotebookUI), mais cliquer une
                    carte l'ajoute au deck au lieu d'ouvrir un zoom — pas d'onglet Cards/Card Backs
                    ici, uniquement la collection à parcourir. */}
                <div className="relative flex h-[900px] w-[1160px] flex-col">
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
                                {cards.length} cards owned
                            </p>
                            <div className="flex h-9 items-center justify-center gap-2">
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
                            <p className="absolute bottom-0 right-1 font-serif text-3xl font-bold italic text-ink-text" style={boldNumberStyle}>
                                {currentPage * 2 + 2}
                            </p>
                        </div>
                    </div>
                </div>

                <PageArrow direction="next" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} />
            </div>
        </div>
    )
}
