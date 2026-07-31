import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id }      = await params
    const { name, cards } = await req.json()

    // Supprime les anciennes cartes du deck et les remplace par les nouvelles
    await prisma.deckCard.deleteMany({ where: { deckId: Number(id) } })

    const deck = await prisma.deck.update({
        where: { id: Number(id) },
        data: {
            name,
            cards: {
                create: cards.map((c: { cardId: string; qty: number }) => ({
                    cardId: c.cardId,
                    qty:    c.qty,
                }))
            }
        }
    })

    return NextResponse.json(deck)
}
