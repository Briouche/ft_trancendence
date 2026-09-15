import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import prisma from '@/lib/prisma'

// Card catalog data (design data) changes only on content updates, not per-request, so cache it
// instead of hitting Postgres on every menu/collection view — was previously a full-table,
// unfiltered query on every single request.
const getCachedCards = unstable_cache(
    () => prisma.card.findMany({ orderBy: { rarity: 'asc' } }),
    ['cards-catalog'],
    { revalidate: 300, tags: ['cards'] }
)

// No session check: this serves the read-only card catalog (design data), not anything
// user-specific, so it's intentionally public unlike the other routes in this folder.
export async function GET() {
    const cards = await getCachedCards()
    return NextResponse.json(cards)
}
