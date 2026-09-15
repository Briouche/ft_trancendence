import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

// Test tool: gives the user one unopened pack.
export async function POST() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.update({
        where: { id: session.userId },
        data:  { unopenedPacks: { increment: 1 } },
        select: { unopenedPacks: true },
    })

    return NextResponse.json({ unopenedPacks: user.unopenedPacks })
}
