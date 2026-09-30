import prisma from "@/lib/prisma";
import {
  DECK_NAME_MAX_LENGTH,
  LEGENDARY_RARITY,
  MAX_LEGENDARY_PER_DECK,
  MAX_NON_LEGENDARY_PER_DECK,
} from "@/lib/decks/requirements";

// Server-side check of a deck save (POST /api/decks, PUT /api/decks/[id]): the builder enforces
// the same rules, but the request body is client-controlled.

export type DeckInput = { name: string; cards: { cardId: string; qty: number }[] };

type DeckParseResult = { ok: true; deck: DeckInput } | { ok: false; error: string };

export async function parseDeckBody(userId: number, body: unknown): Promise<DeckParseResult> {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid request body" };
  const { name, cards } = body as { name?: unknown; cards?: unknown };

  if (typeof name !== "string" || name.trim().length === 0) return { ok: false, error: "Give your deck a name" };
  const trimmedName = name.trim();
  if (trimmedName.length > DECK_NAME_MAX_LENGTH)
    return { ok: false, error: `Deck name must be at most ${DECK_NAME_MAX_LENGTH} characters` };

  if (!Array.isArray(cards) || cards.length === 0) return { ok: false, error: "Add cards to your deck" };

  const entries: DeckInput["cards"] = [];
  const seen = new Set<string>();
  for (const entry of cards) {
    const { cardId, qty } = (entry ?? {}) as { cardId?: unknown; qty?: unknown };
    if (typeof cardId !== "string" || !Number.isInteger(qty) || (qty as number) < 1)
      return { ok: false, error: "Invalid card entry" };
    // DeckCard's primary key is (deckId, cardId): a duplicate would fail the insert.
    if (seen.has(cardId)) return { ok: false, error: "Duplicate card entry" };
    seen.add(cardId);
    entries.push({ cardId, qty: qty as number });
  }

  const owned = await prisma.userCard.findMany({
    where: { userId, cardId: { in: entries.map(e => e.cardId) } },
    select: { cardId: true, qty: true, card: { select: { rarity: true } } },
  });
  const ownedById = new Map(owned.map(o => [o.cardId, o]));

  let legendaryCount = 0;
  let otherCount = 0;
  for (const { cardId, qty } of entries) {
    const ownedCard = ownedById.get(cardId);
    if (!ownedCard || qty > ownedCard.qty) return { ok: false, error: "Deck contains cards you don't own" };
    if (ownedCard.card.rarity === LEGENDARY_RARITY) legendaryCount += qty;
    else otherCount += qty;
  }

  if (legendaryCount > MAX_LEGENDARY_PER_DECK)
    return { ok: false, error: `At most ${MAX_LEGENDARY_PER_DECK} legendary card per deck` };
  if (otherCount > MAX_NON_LEGENDARY_PER_DECK)
    return { ok: false, error: `At most ${MAX_NON_LEGENDARY_PER_DECK} normal cards per deck` };

  return { ok: true, deck: { name: trimmedName, cards: entries } };
}
