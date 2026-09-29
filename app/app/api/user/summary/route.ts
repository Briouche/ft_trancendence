import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
<<<<<<< HEAD
import { requireSession } from '@/lib/api'
=======
import { getSession } from '@/lib/auth/cookieSession'
>>>>>>> origin/merge/readme-review-dev
import { CARD_BACK_COUNT } from '@/lib/cardBacks'

/** GET /api/user/summary — hub stats of the current user: card count, Elo, wins per opponent type, card backs. */
export async function GET() {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth

    const user = await prisma.user.findUniqueOrThrow({
        where:  { id: auth.userId },
        select: {
            winsVsAiEasy:      true,
            winsVsAiMedium:    true,
            winsVsAiHard:      true,
            winsVsPlayer:      true,
            unlockedCardBacks: true,
            unopenedPacks:     true,
            elo:               true,
        },
    })
    const copies = await prisma.userCard.aggregate({ where: { userId: auth.userId }, _sum: { qty: true } })

    return NextResponse.json({
        cardCount:     copies._sum.qty ?? 0,
        elo:           user.elo,
        unopenedPacks: user.unopenedPacks,
        wins: {
            vsAiEasy:   user.winsVsAiEasy,
            vsAiMedium: user.winsVsAiMedium,
            vsAiHard:   user.winsVsAiHard,
            vsPlayer:   user.winsVsPlayer,
        },
        cardBacks: {
            unlocked: user.unlockedCardBacks.length,
            total:    CARD_BACK_COUNT,
        },
    })
}
