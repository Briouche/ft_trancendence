import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

// Route temporaire en attendant un vrai flux de test/reset — vide entièrement la collection de
// cartes de l'utilisateur (ne touche pas aux paquets non ouverts ni au pity counter).
export async function POST() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await prisma.userCard.deleteMany({ where: { userId: session.userId } })

    return NextResponse.json({ ok: true })
}
