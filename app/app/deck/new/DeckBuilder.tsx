'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { type CardFaceData } from '@/components/CardFace'
import ScaledCardFace from '@/components/ScaledCardFace'
import DeskRoom from '../DeskRoom'

type Card = CardFaceData & { qty: number }

type DeckEntry = { card: Card; qty: number }

const MAX_LEGENDARY = 1
const MAX_COMMONS   = 20

function normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function parseCost(cost: string): number {
    const n = Number(cost)
    return Number.isNaN(n) ? Infinity : n
}

const COST_FILTERS = [0, 1, 2, 3, 4, 5, 6, 7]

type Props = {
    cards:        Card[]
    deckId?:      number
    initialName?: string
    initialDeck?: Record<string, DeckEntry>
}

export default function DeckBuilder({ cards, deckId, initialName = '', initialDeck = {} }: Props) {
    const [deck, setDeck]         = useState<Record<string, DeckEntry>>(initialDeck)
    const [deckName, setDeckName] = useState(initialName)
    const [saving, setSaving]     = useState(false)
    const [message, setMessage]   = useState('')
    const [search, setSearch]     = useState('')
    const [sortBy, setSortBy]         = useState<'cost' | 'name'>('cost')
    const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('asc')
    const [costFilter, setCostFilter] = useState<number | null>(null)

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

    // Les légendaires se démarquent du reste de la collection : affichées à part, en haut.
    const legendaryCards = filteredCards.filter(c => c.rarity === 'Légendaire')
    const commonCards    = filteredCards.filter(c => c.rarity !== 'Légendaire')

    // Recliquer le même critère inverse juste sa direction ; changer de critère repart en asc.
    function selectSort(criteria: 'cost' | 'name') {
        if (sortBy === criteria) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(criteria)
            setSortDir('asc')
        }
    }

    function toggleCostFilter(value: number) {
        setCostFilter(f => f === value ? null : value)
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
        setDeck(prev => ({
            ...prev,
            [card.id]: { card, qty: (prev[card.id]?.qty ?? 0) + 1 }
        }))
    }

    function removeCard(cardId: string) {
        setDeck(prev => {
            const entry = prev[cardId]
            if (!entry) return prev
            if (entry.qty <= 1) {
                const { [cardId]: _, ...rest } = prev
                return rest
            }
            return { ...prev, [cardId]: { ...entry, qty: entry.qty - 1 } }
        })
    }

    async function saveDeck() {
        if (!deckName.trim()) { setMessage('Give your deck a name'); return }
        if (totalCards === 0)  { setMessage('Add cards to your deck'); return }

        setSaving(true)
        setMessage('')

        const url    = deckId ? `/api/decks/${deckId}` : '/api/decks'
        const method = deckId ? 'PUT' : 'POST'

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name:  deckName,
                cards: (Object.values(deck) as DeckEntry[]).map(e => ({ cardId: e.card.id, qty: e.qty }))
            })
        })

        setSaving(false)
        if (res.ok) {
            setMessage('✅ Deck saved!')
            if (!deckId) { setDeck({}); setDeckName('') }
        } else {
            setMessage('❌ Error while saving')
        }
    }

    // Décor de la table : de vraies créatures (atk/def renseignés), pas les sorts/effets dont
    // atk/def sont vides ou "X".
    const decorCards = cards.filter(c => c.atk !== '' && c.atk !== 'X' && c.def !== '' && c.def !== 'X').slice(0, 8)

    function renderCardButton(card: Card) {
        const inDeck   = deck[card.id]?.qty ?? 0
        const disabled = !canAdd(card)
        return (
            <button
                key={card.id}
                onClick={() => addCard(card)}
                disabled={disabled}
                className={`relative rounded-lg text-left transition-transform
                    ${disabled ? 'cursor-not-allowed opacity-40 grayscale' : 'cursor-pointer hover:-translate-y-1'}`}
            >
                {inDeck > 0 && (
                    <span className="absolute -left-1.5 -top-1.5 z-30 flex h-6 w-6 items-center justify-center
                        rounded-full border-2 border-parchment-50 bg-gold-500 font-display text-[11px]
                        font-bold text-ink-950 shadow">
                        {inDeck}
                    </span>
                )}
                <ScaledCardFace card={card} />
            </button>
        )
    }

    return (
        <DeskRoom cards={decorCards}>
        <div className="min-h-screen flex">

            {/* Panneau gauche — toutes les cartes possédées */}
            <div className="flex-1 bg-ink-950/85 backdrop-blur-sm p-6 overflow-y-auto">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <p className="font-serif text-xs uppercase tracking-[0.25em] text-gold-400/70 mb-1">
                            Scribe's Workshop
                        </p>
                        <h1 className="font-display text-2xl font-bold text-parchment-100">Build a deck</h1>
                    </div>

                    {/* Filtre par coût exact, à côté du titre — cliquer une case n'affiche que les
                        cartes de ce coût-là ; recliquer la même case retire le filtre. */}
                    {cards.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {COST_FILTERS.map(value => (
                                <button
                                    key={value}
                                    onClick={() => toggleCostFilter(value)}
                                    aria-pressed={costFilter === value}
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg border font-display text-sm font-bold transition-colors
                                        ${costFilter === value
                                            ? 'border-gold-400 bg-gold-500 text-ink-950'
                                            : 'border-leather-700 bg-ink-900 text-parchment-300/70 hover:bg-ink-800'}`}
                                >
                                    {value}
                                </button>
                            ))}
                            {costFilter !== null && (
                                <button
                                    onClick={() => toggleCostFilter(costFilter)}
                                    className="ml-1 font-serif text-xs text-parchment-300/50 underline hover:text-parchment-100"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    )}

                    <Link
                        href="/deck"
                        className="rounded-lg border border-leather-700 bg-ink-900 px-4 py-2 font-display text-sm
                            font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                    >
                        ⟵ My decks
                    </Link>
                </div>

                {cards.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-6">
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search a name or an effect..."
                            className="flex-1 min-w-[220px] rounded-lg border border-leather-700 bg-ink-900 px-4 py-2
                                font-serif text-sm text-parchment-100 placeholder:text-parchment-300/40 outline-none
                                focus:ring-2 focus:ring-gold-500"
                        />
                        <button
                            onClick={() => selectSort('cost')}
                            className={`whitespace-nowrap rounded-lg border px-4 py-2 font-display text-sm font-bold transition-colors
                                ${sortBy === 'cost'
                                    ? 'border-gold-500/60 bg-leather-800 text-parchment-100'
                                    : 'border-leather-700 bg-ink-900 text-parchment-300/70 hover:bg-ink-800'}`}
                        >
                            ◆ Cost {sortBy === 'cost' && (sortDir === 'asc' ? '↑' : '↓')}
                        </button>
                        <button
                            onClick={() => selectSort('name')}
                            className={`whitespace-nowrap rounded-lg border px-4 py-2 font-display text-sm font-bold transition-colors
                                ${sortBy === 'name'
                                    ? 'border-gold-500/60 bg-leather-800 text-parchment-100'
                                    : 'border-leather-700 bg-ink-900 text-parchment-300/70 hover:bg-ink-800'}`}
                        >
                            A–Z {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                        </button>
                    </div>
                )}

                {cards.length === 0 ? (
                    <div className="text-center py-20 text-parchment-300/50">
                        <p className="text-5xl mb-4">🗝️</p>
                        <p className="font-display text-lg text-parchment-200">Your collection is empty</p>
                        <p className="font-serif text-sm mt-2">
                            <Link href="/packs" className="text-gold-400 hover:underline">Open some packs</Link> to get cards
                        </p>
                    </div>
                ) : filteredCards.length === 0 ? (
                    <p className="text-center py-20 font-serif text-parchment-300/50">No cards match your search</p>
                ) : (
                    <>
                        {legendaryCards.length > 0 && (
                            <>
                                <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-4">
                                    {legendaryCards.map(renderCardButton)}
                                </div>
                                {/* Petite séparation entre les légendaires et le reste de la collection. */}
                                <div className="my-5 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-gold-500/30" />
                                    <span className="font-serif text-xs uppercase tracking-[0.2em] text-gold-400/60">
                                        Common
                                    </span>
                                    <div className="h-px flex-1 bg-gold-500/30" />
                                </div>
                            </>
                        )}
                        <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-4">
                            {commonCards.map(renderCardButton)}
                        </div>
                    </>
                )}
            </div>

            {/* Panneau droit — deck en cours */}
            <div className="w-80 bg-ink-900/90 backdrop-blur-sm border-l border-leather-800 p-4 flex flex-col gap-4 sticky top-0 h-screen overflow-y-auto">
                <div>
                    <h2 className="font-display font-bold text-lg text-parchment-100 mb-1">My Deck</h2>
                    <p className="font-serif text-xs text-parchment-300/60">
                        {legendaryCount}/{MAX_LEGENDARY} legendary · {commonCount}/{MAX_COMMONS} common
                    </p>
                    <p className="font-serif text-xs text-parchment-300/60">{totalCards} / {MAX_LEGENDARY + MAX_COMMONS} cards</p>
                </div>

                <input
                    type="text"
                    placeholder="Deck name..."
                    value={deckName}
                    onChange={e => setDeckName(e.target.value)}
                    className="rounded-lg border border-leather-700 bg-ink-950 px-3 py-2 font-serif text-sm
                        text-parchment-100 outline-none focus:ring-2 focus:ring-gold-500"
                />

                <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                    {Object.values(deck).length === 0 && (
                        <p className="font-serif text-sm text-center text-parchment-300/40 mt-8">
                            Click a card to add it
                        </p>
                    )}
                    {Object.values(deck).map(({ card, qty }) => (
                        <div
                            key={card.id}
                            className="flex items-center gap-2 rounded-lg border border-leather-700 bg-parchment-100 p-2"
                        >
                            <span className="text-xl">{card.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <div className="font-display text-xs font-bold text-ink-900 truncate">{card.name}</div>
                                <div className="font-serif text-xs text-leather-800">◆{card.cost} ⚔{card.atk} 🛡{card.def}</div>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="font-display text-xs font-bold text-ink-900">x{qty}</span>
                                <button
                                    onClick={() => removeCard(card.id)}
                                    className="px-1 font-bold leading-none text-red-800 hover:text-red-600"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {message && (
                    <p className="font-serif text-sm text-center text-gold-300">{message}</p>
                )}

                <button
                    onClick={saveDeck}
                    disabled={saving || totalCards === 0}
                    className="rounded-xl border border-gold-500/50 bg-leather-800 py-3 font-display font-bold
                        text-parchment-100 shadow transition-colors hover:bg-leather-700
                        disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {saving ? 'Saving...' : 'Save deck'}
                </button>
            </div>
        </div>
        </DeskRoom>
    )
}
