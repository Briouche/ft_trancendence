// Deck building rules, enforced by the builder and again by /api/decks.
export const LEGENDARY_RARITY = "Légendaire";
export const MAX_LEGENDARY_PER_DECK = 1;
export const MAX_NON_LEGENDARY_PER_DECK = 20;
export const DECK_NAME_MAX_LENGTH = 30;

// Deck id from a URL segment, or null if it can't be one: Deck.id is a Postgres int, and Prisma
// throws (a 500, not a 404) on NaN or anything past its range.
const DECK_ID_MAX = 2_147_483_647;
export function parseDeckId(raw: string): number | null {
  if (!/^\d{1,10}$/.test(raw)) return null;
  const id = Number(raw);
  return id >= 1 && id <= DECK_ID_MAX ? id : null;
}
