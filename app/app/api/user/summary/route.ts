import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth/cookieSession'
import { CARD_BACK_COUNT } from '@/lib/cardBacks'

// Hub stats of the current user: card count, Elo, wins per opponent type, card backs.
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
            elo:               true,
            cards:             { select: { qty: true } },
        },
    })

    const cardCount = user?.cards.reduce((sum, c) => sum + c.qty, 0) ?? 0

    return NextResponse.json({
        cardCount,
        elo: user?.elo ?? 1000,
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
