import prisma from "@/lib/prisma";
import DeckBuilder from "../new/DeckBuilder";

export default async function EditDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [deck, allCards] = await Promise.all([
    prisma.deck.findUnique({
      where: { id: Number(id) },
      include: { cards: { include: { card: true } } },
    }),
    prisma.card.findMany({
      orderBy: [{ rarity: "desc" }, { name: "asc" }],
    }),
  ]);

  if (!deck) return <div className="text-white p-8">Deck introuvable</div>;

  // Convertit les cartes du deck au format attendu par DeckBuilder
  const initialDeck = Object.fromEntries(
    deck.cards.map((dc) => [dc.cardId, { card: dc.card, qty: dc.qty }]),
  );

  return (
    <DeckBuilder
      cards={allCards}
      deckId={deck.id}
      initialName={deck.name}
      initialDeck={initialDeck}
    />
  );
}
