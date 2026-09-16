import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth/cookieSession'
import { CARD_BACK_COUNT } from '@/lib/cardBacks'

// Used by HubBackground to refresh cardCount/wins each time the hub is revisited, without ever
// re-fetching username from the server (already in the session JWT, see layout.tsx) or
// remounting the component that keeps the three-fiber Canvas alive across navigations.
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

    // Total cards owned (counting duplicates), not distinct cards owned — kept consistent with
    // the count HomePage renders (see page.tsx).
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
