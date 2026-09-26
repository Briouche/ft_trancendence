// Deck-building rules, shared by the deck builder (client) and the deck API (server) so the two
// can't drift apart: the client enforces them for UX, the server enforces them for real.

export const LEGENDARY_RARITY = "Légendaire";

export const MAX_LEGENDARY = 1;
export const MAX_NON_LEGENDARY = 20;
export const DECK_NAME_MAX_LENGTH = 50;
