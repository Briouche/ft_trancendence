import prisma from '@/lib/prisma'
import DeckList from './DeckList'

export default async function DecksPage() {
    const decks = await prisma.deck.findMany({
        where:   { userId: 1 }, // TODO: remplacer par l'utilisateur connecté
        include: { cards: true },
        orderBy: { createdAt: 'desc' },
    })

    return <DeckList decks={decks} />
}
