import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth/cookieSession'
import { isValidCardBack } from '@/lib/cardBacks'

export async function POST(request: Request) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const cardBack = body?.cardBack

    if (!isValidCardBack(cardBack)) {
        return NextResponse.json({ error: 'Invalid card back' }, { status: 400 })
    }

    // Re-check unlock status server-side even though the UI only ever offers unlocked backs —
    // this is the actual enforcement point, not just a UX nicety.
    const user = await prisma.user.findUniqueOrThrow({
        where:  { id: session.userId },
        select: { unlockedCardBacks: true },
    })
    if (!user.unlockedCardBacks.includes(cardBack)) {
        return NextResponse.json({ error: 'Card back not unlocked' }, { status: 403 })
    }

    await prisma.user.update({
        where: { id: session.userId },
        data:  { cardBack },
    })

    return NextResponse.json({ cardBack })
}
