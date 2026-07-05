import Link from 'next/link'
import prisma from '@/lib/prisma'

export default async function DecksPage() {
    const decks = await prisma.deck.findMany({
        where:   { userId: 1 }, // TODO: remplacer par l'utilisateur connecté
        include: { cards: true },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="min-h-screen bg-ink-950 p-6 md:p-10">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <p className="font-serif text-xs uppercase tracking-[0.25em] text-gold-400/70 mb-1">
                            Atelier du Scribe
                        </p>
                        <h1 className="font-display text-3xl font-bold text-parchment-100">Mes decks</h1>
                        <p className="font-serif italic text-parchment-300/60 mt-1">
                            {decks.length} deck{decks.length !== 1 ? 's' : ''} sauvegardé{decks.length !== 1 ? 's' : ''}
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
                            + Nouveau deck
                        </Link>
                    </div>
                </div>

                {decks.length === 0 ? (
                    <div className="text-center py-20 text-parchment-300/50">
                        <p className="text-5xl mb-4">🖋️</p>
                        <p className="font-display text-lg text-parchment-200">Aucun deck pour l'instant</p>
                        <p className="font-serif text-sm mt-2">Crée ton premier deck pour commencer</p>
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
                                        bg-ink-900 p-5 shadow transition-colors hover:border-gold-500/50 hover:bg-ink-800"
                                >
                                    <div>
                                        <h2 className="font-display font-bold text-lg text-parchment-100">{deck.name}</h2>
                                        <p className="font-serif text-sm text-parchment-300/60 mt-1">
                                            {total} carte{total !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-serif text-xs text-parchment-300/50">
                                            {new Date(deck.createdAt).toLocaleDateString('fr-FR')}
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
    )
}
