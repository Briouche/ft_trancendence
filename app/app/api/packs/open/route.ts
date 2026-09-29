import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { openPack } from '@/lib/packs'
import { getSession } from '@/lib/auth/cookieSession'

export async function POST() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        const result = await openPack(prisma, session.userId)
        return NextResponse.json(result)
    } catch (error) {
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 400 }
        )
    }
}
