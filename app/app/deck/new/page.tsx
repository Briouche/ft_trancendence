import prisma from '@/lib/prisma'
import DeckBuilder from './DeckBuilder'

export default async function DeckPage() {
    const cards = await prisma.card.findMany({
        orderBy: [{ rarity: 'desc' }, { name: 'asc' }]
    })

    return <DeckBuilder cards={cards} />
}
