import prisma from '@/lib/prisma'
import DeckBuilder from '../new/DeckBuilder'

export default async function EditDeckPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // TODO: remplacer par l'utilisateur connecté quand l'auth sera en place
    const userId = 1

    const [deck, owned] = await Promise.all([
        prisma.deck.findUnique({
            where:   { id: Number(id) },
            include: { cards: { include: { card: true } } }
        }),
        prisma.userCard.findMany({
            where:   { userId },
            include: { card: true },
            orderBy: [{ card: { rarity: 'desc' } }, { card: { name: 'asc' } }],
        })
    ])

    if (!deck) return <div className="text-white p-8">Deck not found</div>

    // qty ici = nombre d'exemplaires possédés par le joueur (utilisé comme plafond dans DeckBuilder)
    const cards = owned.map(({ card, qty }) => ({ ...card, qty }))

    // Convertit les cartes du deck au format attendu par DeckBuilder
    const initialDeck = Object.fromEntries(
        deck.cards.map(dc => [
            dc.cardId,
            { card: dc.card, qty: dc.qty }
        ])
    )

    return (
        <DeckBuilder
            cards={cards}
            deckId={deck.id}
            initialName={deck.name}
            initialDeck={initialDeck}
        />
    )
}
