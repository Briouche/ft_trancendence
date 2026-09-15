import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { CARD_BACK_COUNT } from '@/lib/cardBacks'

// Test tool: gives the user every card at max quantity and every card back.
export async function POST() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cards = await prisma.card.findMany({ select: { id: true, qty: true } })

    await prisma.$transaction([
        ...cards.map(card => prisma.userCard.upsert({
            where:  { userId_cardId: { userId: session.userId, cardId: card.id } },
            create: { userId: session.userId, cardId: card.id, qty: card.qty },
            update: { qty: card.qty },
        })),
        prisma.user.update({
            where: { id: session.userId },
            data:  { unlockedCardBacks: Array.from({ length: CARD_BACK_COUNT }, (_, i) => i) },
        }),
    ])

    return NextResponse.json({ ok: true })
}
