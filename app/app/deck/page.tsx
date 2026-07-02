import Link from 'next/link'
import prisma from '@/lib/prisma'

export default async function DecksPage() {
    const decks = await prisma.deck.findMany({
        where:   { userId: 1 }, // TODO: remplacer par l'utilisateur connecté
        include: { cards: true },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="min-h-screen bg-gray-900 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Mes decks</h1>
                        <p className="text-gray-400 mt-1">{decks.length} deck{decks.length !== 1 ? 's' : ''} sauvegardé{decks.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Link
                        href="/deck/new"
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-3 rounded-xl transition-colors"
                    >
                        + Créer un deck
                    </Link>
                </div>

                {decks.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-5xl mb-4">🃏</p>
                        <p className="text-lg">Aucun deck pour l'instant</p>
                        <p className="text-sm mt-2">Crée ton premier deck pour commencer</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {decks.map(deck => {
                            const total = deck.cards.reduce((sum, c) => sum + c.qty, 0)
                            return (
                                <Link
                                    key={deck.id}
                                    href={`/deck/${deck.id}`}
                                    className="bg-gray-800 hover:bg-gray-700 transition-colors rounded-xl p-5 border border-gray-700 flex items-center justify-between"
                                >
                                    <div>
                                        <h2 className="text-white font-bold text-lg">{deck.name}</h2>
                                        <p className="text-gray-400 text-sm mt-1">{total} carte{total !== 1 ? 's' : ''}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 text-xs">
                                            {new Date(deck.createdAt).toLocaleDateString('fr-FR')}
                                        </span>
                                        <span className="text-gray-400 text-sm">✏️</span>
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
