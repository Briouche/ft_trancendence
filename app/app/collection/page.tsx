import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { ROUTES } from '@/config/routes'
import CollectionBook from './CollectionBook'

export default async function CollectionPage() {
    const session = await getSession()
    if (!session) redirect(ROUTES.home)

    const owned = await prisma.userCard.findMany({
        where:   { userId: session.userId },
        include: { card: true },
        orderBy: { card: { name: 'asc' } }, // CollectionBook retrie ensuite par le vrai coût côté client
    })

    const cards = owned.map(({ card, qty }) => ({ ...card, ownedQty: qty }))

    return <CollectionBook cards={cards} />
}
