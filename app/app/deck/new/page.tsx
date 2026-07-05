import prisma from '@/lib/prisma'
import DeckBuilder from './DeckBuilder'

export default async function DeckPage() {
    // TODO: remplacer par l'utilisateur connecté quand l'auth sera en place
    const userId = 1

    const owned = await prisma.userCard.findMany({
        where:   { userId },
        include: { card: true },
        orderBy: [{ card: { rarity: 'desc' } }, { card: { name: 'asc' } }],
    })

    // qty ici = nombre d'exemplaires possédés par le joueur (utilisé comme plafond dans DeckBuilder)
    const cards = owned.map(({ card, qty }) => ({ ...card, qty }))

    return <DeckBuilder cards={cards} />
}
