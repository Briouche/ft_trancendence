import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { DEV_TOOLS_ENABLED } from '@/lib/devTools'
import { CARD_BACK_COUNT } from '@/lib/cardBacks'

// Test tool: gives the user every card at max quantity and every card back.
export async function POST() {
    if (!DEV_TOOLS_ENABLED) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const cards = await prisma.card.findMany({ select: { id: true, qty: true } })

    // One bulk upsert instead of one round trip per card in the whole catalog (was a full N+1).
    await prisma.$transaction([
        ...(cards.length > 0 ? [prisma.$executeRaw`
            INSERT INTO "UserCard" ("userId", "cardId", "qty")
            VALUES ${Prisma.join(cards.map(card => Prisma.sql`(${session.userId}, ${card.id}, ${card.qty})`))}
            ON CONFLICT ("userId", "cardId")
            DO UPDATE SET "qty" = EXCLUDED."qty"
        `] : []),
        prisma.user.update({
            where: { id: session.userId },
            data:  { unlockedCardBacks: Array.from({ length: CARD_BACK_COUNT }, (_, i) => i) },
        }),
    ])

    return NextResponse.json({ ok: true })
}
