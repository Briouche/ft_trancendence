import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

// Temporary route standing in for a real way to earn packs (playing games, rewards, etc).
export async function POST() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Explicit select: the real User table has no `name` column (unlike the Prisma schema) —
    // an update without a select tries to read it back and crashes the query.
    const user = await prisma.user.update({
        where: { id: session.userId },
        data:  { unopenedPacks: { increment: 1 } },
        select: { unopenedPacks: true },
    })

    return NextResponse.json({ unopenedPacks: user.unopenedPacks })
}
