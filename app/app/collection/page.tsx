import prisma from '@/lib/prisma'
import CollectionBook from './CollectionBook'

export default async function CollectionPage() {
    // TODO: remplacer par l'utilisateur connecté quand l'auth sera en place
    const userId = 1

    const owned = await prisma.userCard.findMany({
        where:   { userId },
        include: { card: true },
        orderBy: { card: { name: 'asc' } }, // CollectionBook retrie ensuite par le vrai coût côté client
    })

    const cards = owned.map(({ card, qty }) => ({ ...card, ownedQty: qty }))

    return <CollectionBook cards={cards} />
}
