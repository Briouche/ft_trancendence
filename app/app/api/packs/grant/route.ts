import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Route temporaire en attendant un vrai moyen de gagner des paquets (parties jouées, récompenses...)
export async function POST() {
    // TODO: remplacer par l'utilisateur connecté quand l'auth sera en place
    const userId = 1

    const user = await prisma.user.update({
        where: { id: userId },
        data:  { unopenedPacks: { increment: 1 } },
    })

    return NextResponse.json({ unopenedPacks: user.unopenedPacks })
}
