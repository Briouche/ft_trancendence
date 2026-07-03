'use client'

import { useState } from 'react'

type Card = {
    id:       string
    name:     string
    rarity:   string
    cost:     string
    atk:      string
    def:      string
    emoji:    string
    color:    string
    qty:      number
}

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
        <div className="min-h-screen bg-gray-900 flex">

            {/* Panneau gauche — toutes les cartes */}
            <div className="flex-1 p-6 overflow-y-auto">
                <h1 className="text-2xl font-bold text-white mb-6">Construire un deck</h1>
                <div className="grid grid-cols-3 xl:grid-cols-5 gap-3">
                    {cards.map(card => {
                        const inDeck   = deck[card.id]?.qty ?? 0
                        const disabled = !canAdd(card)
                        return (
                            <button
                                key={card.id}
                                onClick={() => addCard(card)}
                                disabled={disabled}
                                className={`rounded-xl p-3 flex flex-col gap-1 text-left border-2 transition-all
                                    ${disabled
                                        ? 'opacity-40 cursor-not-allowed border-transparent'
                                        : 'hover:scale-105 hover:border-white border-transparent cursor-pointer'
                                    }`}
                                style={{ backgroundColor: card.color || '#374151' }}
                            >
                                <div className="flex justify-between items-start">
                                    <span className="text-2xl">{card.emoji}</span>
                                    {inDeck > 0 && (
                                        <span className="bg-black/50 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                                            {inDeck}
                                        </span>
                                    )}
                                </div>
                                <span className="font-bold text-xs text-gray-900 leading-tight">{card.name}</span>
                                <span className="text-xs text-gray-700 italic">{card.rarity}</span>
                                <div className="flex justify-between text-xs font-mono mt-auto pt-1 border-t border-black/20">
                                    <span>⚔️{card.atk}</span>
                                    <span>🛡️{card.def}</span>
                                    <span>💎{card.cost}</span>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Panneau droit — deck en cours */}
            <div className="w-72 bg-gray-800 p-4 flex flex-col gap-4 sticky top-0 h-screen overflow-y-auto border-l border-gray-700">
                <div>
                    <h2 className="text-white font-bold text-lg mb-1">Mon deck</h2>
                    <p className="text-gray-400 text-xs">
                        {legendaryCount}/{MAX_LEGENDARY} légendaire · {commonCount}/{MAX_COMMONS} communes
                    </p>
                    <p className="text-gray-400 text-xs">{totalCards} / {MAX_LEGENDARY + MAX_COMMONS} cartes</p>
                </div>

                <input
                    type="text"
                    placeholder="Nom du deck..."
                    value={deckName}
                    onChange={e => setDeckName(e.target.value)}
                    className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />

                <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                    {Object.values(deck).length === 0 && (
                        <p className="text-gray-500 text-sm text-center mt-8">
                            Clique sur une carte pour l'ajouter
                        </p>
                    )}
                    {Object.values(deck).map(({ card, qty }) => (
                        <div
                            key={card.id}
                            className="flex items-center gap-2 rounded-lg p-2"
                            style={{ backgroundColor: card.color || '#374151' }}
                        >
                            <span className="text-xl">{card.emoji}</span>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-gray-900 truncate">{card.name}</div>
                                <div className="text-xs text-gray-700">💎{card.cost} ⚔️{card.atk} 🛡️{card.def}</div>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-gray-900">x{qty}</span>
                                <button
                                    onClick={() => removeCard(card.id)}
                                    className="text-red-800 hover:text-red-600 text-sm font-bold leading-none px-1"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {message && (
                    <p className="text-sm text-center text-yellow-300">{message}</p>
                )}

                <button
                    onClick={saveDeck}
                    disabled={saving || totalCards === 0}
                    className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
                >
                    {saving ? 'Sauvegarde...' : 'Sauvegarder le deck'}
                </button>
            </div>
        </div>
    )
}
