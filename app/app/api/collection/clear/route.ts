import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { DEFAULT_UNLOCKED_CARD_BACKS } from '@/lib/cardBacks'

// Temporary route standing in for a real test/reset flow — wipes the user's card collection
// (unopened packs and the pity counter are untouched) and resets card backs and the equipped
// cardBack to a fresh account's defaults, since achievement-earned backs are tied to the
// collection that was just cleared.
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
