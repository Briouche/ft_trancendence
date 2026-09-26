import "server-only";

import prisma from "@/lib/prisma";
import { LEGENDARY_RARITY, MAX_LEGENDARY, MAX_NON_LEGENDARY } from "@/lib/deckRules";
import { deckBodySchema, firstIssue, idSchema } from "@/lib/validation";

// Server-side validation of a deck sent by the client (POST/PUT /api/decks).

export type DeckInput = { name: string; cards: { cardId: string; qty: number }[] };

type DeckValidation = { ok: true; deck: DeckInput } | { ok: false; error: string };

/** Positive integer route param ("12"), or null for anything else ("abc", "1.5", "-3"). */
export function parseDeckId(raw: string): number | null {
  const parsed = idSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/**
 * Checks the body shape, then the rules of the deck builder against the user's actual
 * collection: every card must be owned in at least that many copies, and the legendary / other
 * card caps apply. Without this, a hand-crafted request could build a deck out of any card in
 * the catalog.
 */
export async function validateDeckInput(body: unknown, userId: number): Promise<DeckValidation> {
  const parsed = deckBodySchema.safeParse(body);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { name, cards } = parsed.data;

  const qtyByCard = new Map<string, number>();
  for (const { cardId, qty } of cards) {
    if (qtyByCard.has(cardId)) return { ok: false, error: "Duplicate card entry" };
    qtyByCard.set(cardId, qty);
  }

  const owned = await prisma.userCard.findMany({
    where: { userId, cardId: { in: [...qtyByCard.keys()] } },
    select: { cardId: true, qty: true, card: { select: { rarity: true } } },
  });
  const ownedById = new Map(owned.map((o) => [o.cardId, o]));

  let legendaryCount = 0;
  let otherCount = 0;
  for (const [cardId, qty] of qtyByCard) {
    const own = ownedById.get(cardId);
    if (!own || own.qty < qty) return { ok: false, error: "Deck uses cards you don't own" };
    if (own.card.rarity === LEGENDARY_RARITY) legendaryCount += qty;
    else otherCount += qty;
  }

  if (legendaryCount > MAX_LEGENDARY) return { ok: false, error: `At most ${MAX_LEGENDARY} legendary card` };
  if (otherCount > MAX_NON_LEGENDARY) return { ok: false, error: `At most ${MAX_NON_LEGENDARY} non-legendary cards` };

  return {
    ok: true,
    deck: { name, cards: [...qtyByCard].map(([cardId, qty]) => ({ cardId, qty })) },
  };
}
