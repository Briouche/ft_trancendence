import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth/cookieSession'
import { ROUTES } from '@/config/routes'
import PackOpener from './PackOpener'
import { DEV_TOOLS_ENABLED } from '@/lib/devTools'

export const metadata: Metadata = { title: 'Packs' }

/** /packs — open the packs earned by winning matches. */
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
            devTools={DEV_TOOLS_ENABLED}
        />
    )
}
