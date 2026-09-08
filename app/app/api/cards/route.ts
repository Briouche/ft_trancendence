import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// No session check: this serves the read-only card catalog (design data), not anything
// user-specific, so it's intentionally public unlike the other routes in this folder.
export async function GET() {
    const cards = await prisma.card.findMany({
        orderBy: { rarity: 'asc' }
    })
    return NextResponse.json(cards)
}
