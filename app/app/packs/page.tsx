import prisma from '@/lib/prisma'
import PackOpener from './PackOpener'

export default async function PacksPage() {
    // TODO: remplacer par l'utilisateur connecté quand l'auth sera en place
    const userId = 1

    const user = await prisma.user.findUniqueOrThrow({
        where:  { id: userId },
        select: { unopenedPacks: true, pityCounter: true },
    })

    return (
        <PackOpener
            initialPacks={user.unopenedPacks}
            initialPityCounter={user.pityCounter}
        />
    )
}
