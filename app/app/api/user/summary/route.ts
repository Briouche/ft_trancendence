import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

// Utilisé par HubBackground pour rafraîchir cardCount/wins à chaque retour sur le hub, sans
// jamais redemander username au serveur (déjà dans le JWT de session, voir layout.tsx) ni
// remonter le composant qui garde le Canvas three-fiber en vie entre les navigations.
export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({
        where:  { id: session.userId },
        select: { wins: true, cards: { select: { qty: true } } },
    })

    // Nombre total de cartes possédées (copies comprises), pas le nombre de cartes distinctes —
    // même calcul que HomePage avant ce refactor (voir page.tsx).
    const cardCount = user?.cards.reduce((sum, c) => sum + c.qty, 0) ?? 0

    return NextResponse.json({ cardCount, wins: user?.wins ?? 0 })
}
