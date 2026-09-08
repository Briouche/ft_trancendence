import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { CARD_BACK_COUNT } from '@/lib/cardBacks'

// Utilisé par HubBackground pour rafraîchir cardCount/wins à chaque retour sur le hub, sans
// jamais redemander username au serveur (déjà dans le JWT de session, voir layout.tsx) ni
// remonter le composant qui garde le Canvas three-fiber en vie entre les navigations.
export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
        where:  { id: session.userId },
        select: {
            winsVsAiEasy:      true,
            winsVsAiMedium:    true,
            winsVsAiHard:      true,
            winsVsPlayer:      true,
            unlockedCardBacks: true,
            cards:             { select: { qty: true } },
        },
    })

    // Nombre total de cartes possédées (copies comprises), pas le nombre de cartes distinctes —
    // même calcul que HomePage avant ce refactor (voir page.tsx).
    const cardCount = user?.cards.reduce((sum, c) => sum + c.qty, 0) ?? 0

    return NextResponse.json({
        cardCount,
        wins: {
            vsAiEasy:   user?.winsVsAiEasy   ?? 0,
            vsAiMedium: user?.winsVsAiMedium ?? 0,
            vsAiHard:   user?.winsVsAiHard   ?? 0,
            vsPlayer:   user?.winsVsPlayer   ?? 0,
        },
        cardBacks: {
            unlocked: user?.unlockedCardBacks.length ?? 1,
            total:    CARD_BACK_COUNT,
        },
    })
}
