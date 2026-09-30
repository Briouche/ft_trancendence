import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { NoPackError, openPack } from '@/lib/packs'
import { getSession } from '@/lib/auth/cookieSession'

/** POST /api/packs/open — opens one unopened pack; returns the cards and any card back it unlocked. */
export async function POST() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    try {
        return NextResponse.json(await openPack(prisma, session.userId))
    } catch (error) {
        if (error instanceof NoPackError) return NextResponse.json({ error: error.message }, { status: 400 })
        throw error
    }
}
