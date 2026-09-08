import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { DEFAULT_UNLOCKED_CARD_BACKS } from '@/lib/cardBacks'

// Route temporaire en attendant un vrai flux de test/reset — vide entièrement la collection de
// cartes de l'utilisateur (ne touche pas aux paquets non ouverts ni au pity counter). Remet aussi
// les dos de carte à l'état par défaut d'un nouveau compte (0-2, voir DEFAULT_UNLOCKED_CARD_BACKS),
// pas à [0] seul : sans ça, un dos gagné avant le clear restait débloqué alors que la collection
// qui l'a débloqué (paquets/hauts faits) vient d'être remise à zéro — cardBack réinitialisé à 0 au
// passage, au cas où le dos actuellement équipé ne fait plus partie des dos débloqués après reset.
export async function POST() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.$transaction([
        prisma.userCard.deleteMany({ where: { userId: session.userId } }),
        prisma.user.update({
            where: { id: session.userId },
            data:  { unlockedCardBacks: DEFAULT_UNLOCKED_CARD_BACKS, cardBack: 0 },
        }),
    ])

    return NextResponse.json({ ok: true })
}
