import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { ROUTES } from '@/config/routes'
import PackOpener from './PackOpener'

/** /packs — opens the user's unopened packs (count, pity counter and card back loaded on the server). */
export default async function PacksPage() {
    const session = await getSession()
    if (!session) redirect(ROUTES.home)

    const user = await prisma.user.findUniqueOrThrow({
        where:  { id: session.userId },
        select: { unopenedPacks: true, pityCounter: true, cardBack: true },
    })

    return (
        <PackOpener
            initialPacks={user.unopenedPacks}
            initialPityCounter={user.pityCounter}
            cardBack={user.cardBack}
        />
    )
}
