import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireSession } from '@/lib/api'
import { CARD_BACK_COUNT } from '@/lib/cardBacks'
import { evaluateAchievements } from '@/lib/achievements'

/**
 * GET /api/user/summary — hub stats of the current user: card count, Elo, wins per opponent type,
 * card backs. The hub calls it every time the player comes back to "/" (typically right after a
 * match), so it is also where freshly reached achievements get unlocked and announced.
 */
export async function GET() {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth

    const newAchievements = await evaluateAchievements(auth.userId)

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
        newAchievements: newAchievements.map(a => ({ key: a.key, title: a.title, rewardPacks: a.rewardPacks })),
    })
}
