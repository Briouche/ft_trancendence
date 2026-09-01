import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

// Route temporaire en attendant un vrai moyen de gagner des paquets (parties jouées, récompenses...)
export async function POST() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // select explicite : la table User réelle n'a pas de colonne `name` (contrairement au schema
    // Prisma) — un update sans select tente de la lire au retour et fait planter la requête.
    const user = await prisma.user.update({
        where: { id: session.userId },
        data:  { unopenedPacks: { increment: 1 } },
        select: { unopenedPacks: true },
    })

    return NextResponse.json({ unopenedPacks: user.unopenedPacks })
}
