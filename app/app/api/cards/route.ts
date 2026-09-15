import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// Public card catalog.
export async function GET() {
    const cards = await prisma.card.findMany({
        orderBy: { rarity: 'asc' }
    })
    return NextResponse.json(cards)
}
