import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth/cookieSession'
import { DEV_TOOLS_ENABLED } from '@/lib/devTools'
import { DEFAULT_UNLOCKED_CARD_BACKS } from '@/lib/cardBacks'

/** Development-only test tool (404 in production): empties the user's collection and resets card backs to a fresh account's. */
export async function POST() {
    if (!DEV_TOOLS_ENABLED) return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
