'use client'

import { useState } from 'react'
import Link from 'next/link'
import CardFace, { type CardFaceData } from '@/components/CardFace'

type Card = CardFaceData & { qty: number }

type DeckEntry = { card: Card; qty: number }

const MAX_LEGENDARY = 1
const MAX_COMMONS   = 20

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
        if (!deckName.trim()) { setMessage('Donne un nom à ton deck'); return }
        if (totalCards === 0)  { setMessage('Ajoute des cartes à ton deck'); return }

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
            setMessage('✅ Deck sauvegardé !')
            if (!deckId) { setDeck({}); setDeckName('') }
        } else {
            setMessage('❌ Erreur lors de la sauvegarde')
        }
    }

    return (
        <div className="min-h-screen bg-ink-950 flex">

            {/* Panneau gauche — toutes les cartes possédées */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="font-serif text-xs uppercase tracking-[0.25em] text-gold-400/70 mb-1">
                            Atelier du Scribe
                        </p>
                        <h1 className="font-display text-2xl font-bold text-parchment-100">Construire un deck</h1>
                    </div>
                    <Link
                        href="/deck"
                        className="rounded-lg border border-leather-700 bg-ink-900 px-4 py-2 font-display text-sm
                            font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                    >
                        ⟵ Mes decks
                    </Link>
                </div>

                {cards.length === 0 ? (
                    <div className="text-center py-20 text-parchment-300/50">
                        <p className="text-5xl mb-4">🗝️</p>
                        <p className="font-display text-lg text-parchment-200">Ta collection est vide</p>
                        <p className="font-serif text-sm mt-2">
                            <Link href="/packs" className="text-gold-400 hover:underline">Ouvre des paquets</Link> pour obtenir des cartes
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-4">
                        {cards.map(card => {
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
                                    <CardFace card={card} />
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Panneau droit — deck en cours */}
            <div className="w-80 bg-ink-900 border-l border-leather-800 p-4 flex flex-col gap-4 sticky top-0 h-screen overflow-y-auto">
                <div>
                    <h2 className="font-display font-bold text-lg text-parchment-100 mb-1">Mon deck</h2>
                    <p className="font-serif text-xs text-parchment-300/60">
                        {legendaryCount}/{MAX_LEGENDARY} légendaire · {commonCount}/{MAX_COMMONS} communes
                    </p>
                    <p className="font-serif text-xs text-parchment-300/60">{totalCards} / {MAX_LEGENDARY + MAX_COMMONS} cartes</p>
                </div>

                <input
                    type="text"
                    placeholder="Nom du deck..."
                    value={deckName}
                    onChange={e => setDeckName(e.target.value)}
                    className="rounded-lg border border-leather-700 bg-ink-950 px-3 py-2 font-serif text-sm
                        text-parchment-100 outline-none focus:ring-2 focus:ring-gold-500"
                />

                <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                    {Object.values(deck).length === 0 && (
                        <p className="font-serif text-sm text-center text-parchment-300/40 mt-8">
                            Clique sur une carte pour l'ajouter
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
                    {saving ? 'Sauvegarde...' : 'Sauvegarder le deck'}
                </button>
            </div>
        </div>
    )
}
