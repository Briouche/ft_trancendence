import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/auth/cookieSession'
import { isValidCardBack } from '@/lib/cardBacks'

// Equips one of the user's unlocked card backs.
export async function POST(request: Request) {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => null)
    const cardBack = body?.cardBack

    if (!isValidCardBack(cardBack)) {
        return NextResponse.json({ error: 'Invalid card back' }, { status: 400 })
    }

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
