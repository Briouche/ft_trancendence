'use client'

import Link from 'next/link'
import DeskRoom from './DeskRoom'
import { type CardFaceData } from '@/components/CardFace'
import RoundedRectangle from '@/components/elements/RoundedRectangle'

type Deck = {
    id:        number
    name:      string
    createdAt: Date | string
    cards:     { qty: number }[]
}

export default function DeckList({ decks, decorCards = [] }: { decks: Deck[]; decorCards?: CardFaceData[] }) {
    return (
        <DeskRoom cards={decorCards}>
            <div className="min-h-screen p-6 md:p-10">
                <div className="max-w-2xl mx-auto">
                    <RoundedRectangle variant="book-cover-panel" className="flex items-center justify-between mb-8 p-5">
                        <div>
                            <p className="font-serif text-xs uppercase tracking-[0.25em] text-ink-muted mb-1">
                                Scribe's Workshop
                            </p>
                            <h1 className="font-display text-3xl font-bold text-ink-text">My Decks</h1>
                            <p className="font-serif italic text-ink-muted mt-1">
                                {decks.length} deck{decks.length !== 1 ? 's' : ''} saved
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Link
                                href="/"
                                className="rounded-lg border border-leather-700 bg-ink-900 px-4 py-2.5 font-display text-sm
                                    font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                            >
                                ⟵ Menu
                            </Link>
                            <Link
                                href="/deck/new"
                                className="rounded-lg border border-gold-500/50 bg-leather-800 px-5 py-2.5 font-display text-sm
                                    font-bold text-parchment-100 shadow transition-colors hover:bg-leather-700"
                            >
                                + New deck
                            </Link>
                        </div>
                    </RoundedRectangle>

                    {decks.length === 0 ? (
                        <div className="text-center py-20 rounded-xl bg-ink-950/80 backdrop-blur-sm text-parchment-300/50">
                            <p className="text-5xl mb-4">🖋️</p>
                            <p className="font-display text-lg text-parchment-200">No decks yet</p>
                            <p className="font-serif text-sm mt-2">Create your first deck to get started</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {decks.map(deck => {
                                const total = deck.cards.reduce((sum, c) => sum + c.qty, 0)
                                return (
                                    <Link
                                        key={deck.id}
                                        href={`/deck/${deck.id}`}
                                        className="flex items-center justify-between rounded-xl border border-leather-700
                                            bg-ink-900/85 backdrop-blur-sm p-5 shadow transition-colors hover:border-gold-500/50 hover:bg-ink-800/90"
                                    >
                                        <div>
                                            <h2 className="font-display font-bold text-lg text-parchment-100">{deck.name}</h2>
                                            <p className="font-serif text-sm text-parchment-300/60 mt-1">
                                                {total} card{total !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-serif text-xs text-parchment-300/50">
                                                {new Date(deck.createdAt).toLocaleDateString('en-US')}
                                            </span>
                                            <span className="text-gold-400 text-sm">✒︎</span>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </DeskRoom>
    )
}
