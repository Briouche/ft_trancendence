import { redirect } from 'next/navigation'
import prisma from "@/lib/prisma";
import { getSession } from '@/lib/session'
import { ROUTES } from '@/config/routes'
import DeckBuilder from "./DeckBuilder";

export const dynamic = "force-dynamic";

export default async function DeckPage() {
    const session = await getSession()
    if (!session) redirect(ROUTES.home)

    const [owned, decks, totalCopies] = await Promise.all([
        prisma.userCard.findMany({
            where:   { userId: session.userId },
            include: { card: true },
            orderBy: [{ card: { rarity: 'desc' } }, { card: { name: 'asc' } }],
        }),
        prisma.deck.findMany({
            where:   { userId: session.userId },
            include: { cards: { include: { card: true } } },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.card.aggregate({ _sum: { qty: true } }),
    ])

    // qty ici = nombre d'exemplaires possédés par le joueur (utilisé comme plafond dans DeckBuilder)
    const cards = owned.map(({ card, qty }) => ({ ...card, qty }))

    return <DeckBuilder cards={cards} decks={decks} totalCardCount={totalCopies._sum.qty ?? 0} />
}
