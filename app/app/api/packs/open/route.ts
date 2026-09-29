import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
<<<<<<< HEAD
import { jsonError, requireSession } from '@/lib/api'
import { NoPackError, openPack } from '@/lib/packs'
=======
import { openPack } from '@/lib/packs'
import { getSession } from '@/lib/auth/cookieSession'
>>>>>>> origin/merge/readme-review-dev

/** POST /api/packs/open — opens one unopened pack; returns the cards and any card back it unlocked. */
export async function POST() {
    const auth = await requireSession()
    if (auth instanceof NextResponse) return auth

    try {
        return NextResponse.json(await openPack(prisma, auth.userId))
    } catch (error) {
        if (error instanceof NoPackError) return jsonError(400, error.message)
        throw error
    }
}
