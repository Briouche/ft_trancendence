import { redirect, notFound } from 'next/navigation'
import prisma from "@/lib/prisma";
import { getSession } from '@/lib/session'
import { ROUTES } from '@/config/routes'
import DeckBuilder from "../new/DeckBuilder";

export default async function EditDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession()
  if (!session) redirect(ROUTES.home)

    const [deck, owned, decks] = await Promise.all([
        prisma.deck.findUnique({
            where:   { id: Number(id) },
            include: { cards: { include: { card: true } } }
        }),
        prisma.userCard.findMany({
            where:   { userId: session.userId },
            include: { card: true },
            orderBy: [{ card: { rarity: 'desc' } }, { card: { name: 'asc' } }],
        }),
        prisma.deck.findMany({
            where:   { userId: session.userId },
            include: { cards: true },
            orderBy: { createdAt: 'desc' },
        }),
    ])

    // Un deck d'un autre joueur (ou inexistant) ne doit ni s'afficher ni fuiter son contenu.
    if (!deck || deck.userId !== session.userId) notFound()

    // qty ici = nombre d'exemplaires possédés par le joueur (utilisé comme plafond dans DeckBuilder)
    const cards = owned.map(({ card, qty }) => ({ ...card, qty }))

  // Convertit les cartes du deck au format attendu par DeckBuilder
  const initialDeck = Object.fromEntries(
    deck.cards.map((dc) => [dc.cardId, { card: dc.card, qty: dc.qty }]),
  );

    return (
        <DeckBuilder
            cards={cards}
            decks={decks}
            deckId={deck.id}
            initialName={deck.name}
            initialDeck={initialDeck}
        />
    )
}
