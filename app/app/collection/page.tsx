import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { ROUTES } from '@/config/routes'
import CollectionBook from './CollectionBook'

export default async function CollectionPage() {
    const session = await getSession()
    if (!session) redirect(ROUTES.home)

    const [owned, user, totalCopies] = await Promise.all([
        prisma.userCard.findMany({
            where:   { userId: session.userId },
            include: { card: true },
            orderBy: { card: { name: 'asc' } }, // CollectionBook re-sorts by the real cost client-side afterward
        }),
        prisma.user.findUniqueOrThrow({
            where:  { id: session.userId },
            select: { cardBack: true, unlockedCardBacks: true },
        }),
        prisma.card.aggregate({ _sum: { qty: true } }),
    ])

    const cards = owned.map(({ card, qty }) => ({ ...card, ownedQty: qty }))

    return (
        <CollectionBook
            cards={cards}
            initialCardBack={user.cardBack}
            unlockedCardBacks={user.unlockedCardBacks}
            totalCardCount={totalCopies._sum.qty ?? 0}
        />
    )
}
