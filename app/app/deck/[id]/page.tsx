import { redirect, notFound } from 'next/navigation'
import prisma from "@/lib/prisma";
import { getSession } from '@/lib/auth/cookieSession'
import { ROUTES } from '@/config/routes'
import { parseDeckId } from '@/lib/decks'
import DeckBuilder from "../new/DeckBuilder";

/** /deck/:id — the deck builder opened on one of the user's saved decks (404 for anyone else's). */
export default async function EditDeckPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const deckId = parseDeckId((await params).id);
    const session = await getSession()
    if (!session) redirect(ROUTES.home)
    if (deckId === null) notFound()

    const [deck, owned, decks, totalCopies] = await Promise.all([
        prisma.deck.findUnique({
            where:   { id: deckId },
            include: { cards: { include: { card: true } } }
        }),
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

    if (!deck || deck.userId !== session.userId) notFound()

    // qty = copies owned, the per-card cap in the builder.
    const cards = owned.map(({ card, qty }) => ({ ...card, qty }))

    const initialDeck = Object.fromEntries(
        deck.cards.map((dc) => [dc.cardId, { card: dc.card, qty: dc.qty }]),
    );

    return (
        <DeckBuilder
            cards={cards}
            decks={decks}
            totalCardCount={totalCopies._sum.qty ?? 0}
            deckId={deck.id}
            initialName={deck.name}
            initialDeck={initialDeck}
        />
    )
}
