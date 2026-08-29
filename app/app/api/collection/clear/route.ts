import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Route temporaire en attendant un vrai flux de test/reset — vide entièrement la collection de
// cartes de l'utilisateur (ne touche pas aux paquets non ouverts ni au pity counter).
export async function POST() {
    // TODO: remplacer par l'utilisateur connecté quand l'auth sera en place
    const userId = 1

    await prisma.userCard.deleteMany({ where: { userId } })

    return NextResponse.json({ ok: true })
}
