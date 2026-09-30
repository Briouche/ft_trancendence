// Deck-building rules, shared by the deck builder (what the UI lets you add) and the server
// (lib/decks.ts, what the API accepts). Client-safe.

/** Rarity label of legendary cards in the catalog (app/prisma/seeds/data/tcg-collection.json). */
export const LEGENDARY_RARITY = "Légendaire";
export const MAX_LEGENDARY = 1;
export const MAX_NON_LEGENDARY = 20;
