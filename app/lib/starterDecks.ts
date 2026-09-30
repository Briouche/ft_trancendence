import "server-only";

import { Prisma } from "@prisma/client";

// Starter deck of every new account: one of the AI decks, picked at random, saved as a deck and
// added to the collection (the deck builder caps each card at the copies owned).
// Copy of game_engine/srcs/cardImport/aiDecks.ts (a separate build, so it can't be imported):
// keep the two in sync. By card name, a repeated name = two copies.

interface StarterDeck {
  name: string;
  cards: string[];
}

const STARTER_DECKS: StarterDeck[] = [
  {
    // Aggro: low curve.
    name: "Aggro",
    cards: [
      "Leon, le chien saucisse",
      "le croupier", "le croupier", "Big mama hyena", "Big mama hyena",
      "Diablotin du piment", "Diablotin du piment", "Critique culinaire", "Critique culinaire",
      "Feed the troops", "Feed the troops", "Hyperactive cousin", "Hyperactive cousin",
      "soulevement de tombes", "une maman aimante", "une maman aimante", "soulevement de tombes",
      "champion de l'arene", "champion de l'arene", "Pyroblin", "Pyroblin",
    ],
  },
  {
    // Control: spells + big late-game creatures.
    name: "Contrôle",
    cards: [
      "Timmy, the planetsucker",
      "Voxotron exterminateur", "Voxotron exterminateur", "call the kraken", "call the kraken",
	  "le croupier", "le croupier", "equal opportunity", "le (gros) thon poli", "le (gros) thon poli",
	  "cannibalisme", "cannibalisme", "bloodsucker", "bloodsucker", "golem endormi", "Sauce TomAAAAAAte",
	  "Sauce TomAAAAAAte", "Pyroblin", "Jumeaux Goblin", "Opika", "Cavalier furieux"
    ],
  },
  {
    // Archimede synergy: the 6 "archi" cards + Archimede.
    name: "Archimède",
    cards: [
      "Archimede la maudite",
      "Haku", "Reborn", "Ribgy", "Neo",
      "Po", "Zurg", "Bertrand", "Le Phoenix",
      "Goblinmikaze", "Flambeur de Dancefloor", "le gros pied puant", "CRS", "Client Mécontent",
      "Feeder goblin", "Cactus dos Pimentos", "Le menestrel", "tortue encourageante",
      "Bibliothequaire", "Pyroblin", "Jumeaux Goblin",
    ],
  },
];

// Called inside the account-creation transaction, so no account exists without its deck.
// Unknown names are skipped with a warning; if none resolve (no cards seeded), nothing is created.
export async function giveStarterDeck(tx: Prisma.TransactionClient, userId: number) {
  const starter = STARTER_DECKS[Math.floor(Math.random() * STARTER_DECKS.length)];

  const cards = await tx.card.findMany({
    where: { name: { in: [...new Set(starter.cards)] } },
    select: { id: true, name: true, qty: true },
  });
  const byName = new Map(cards.map((c) => [c.name, c]));

  // Copies per card id, capped at the card's max copies (Card.qty).
  const qtyById = new Map<string, number>();
  for (const name of starter.cards) {
    const card = byName.get(name);
    if (!card) {
      console.warn(`giveStarterDeck: no card named "${name}" (typo in starterDecks.ts?)`);
      continue;
    }
    qtyById.set(card.id, Math.min((qtyById.get(card.id) ?? 0) + 1, card.qty));
  }
  if (qtyById.size === 0) return;

  const entries = [...qtyById].map(([cardId, qty]) => ({ cardId, qty }));

  await tx.userCard.createMany({ data: entries.map((e) => ({ userId, ...e })) });
  await tx.deck.create({
    data: { name: starter.name, userId, cards: { create: entries } },
  });
}
