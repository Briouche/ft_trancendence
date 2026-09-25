import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

interface RawDeckCard {
  name: string;
  qty: number;
}

interface RawDeck {
  name: string;
  owners: string[];
  cards: RawDeckCard[];
}

// Same limits as the deck builder (app/deck/new/DeckBuilder.tsx).
const MAX_LEGENDARY = 1;
const MAX_COMMONS = 20;

// Seeds premade decks from a JSON fixture (cards referenced by name for readability, resolved to
// ids here). Must run after seedCards() and seedUsers(). Decks are matched by (owner, name), so
// re-running the seed rewrites them in place instead of creating duplicates.
export async function seedDecks(prisma: PrismaClient) {
  const jsonPath = path.resolve(__dirname, "./data/decks-collection.json");
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(raw) as { decks: RawDeck[] };

  console.log(`🗂️  Seeding ${data.decks.length} decks...`);

  const cards = await prisma.card.findMany({ select: { id: true, name: true, qty: true, rarity: true } });
  const cardByName = new Map(cards.map((c) => [c.name, c]));

  for (const deck of data.decks) {
    let legendaryCount = 0;
    let commonCount = 0;

    const deckCards = deck.cards.map((entry) => {
      const card = cardByName.get(entry.name);
      if (!card) throw new Error(`Unknown card "${entry.name}" in deck "${deck.name}"`);
      if (entry.qty > card.qty) {
        throw new Error(`Deck "${deck.name}" has ${entry.qty}x "${entry.name}" (max ${card.qty})`);
      }

      if (card.rarity === "Légendaire") legendaryCount += entry.qty;
      else commonCount += entry.qty;

      return { cardId: card.id, qty: entry.qty };
    });

    if (legendaryCount > MAX_LEGENDARY || commonCount > MAX_COMMONS) {
      throw new Error(
        `Deck "${deck.name}" has ${legendaryCount} legendary / ${commonCount} other cards ` +
          `(max ${MAX_LEGENDARY} / ${MAX_COMMONS})`
      );
    }

    for (const owner of deck.owners) {
      const user = await prisma.user.findUnique({ where: { username: owner.toLowerCase() } });
      if (!user) throw new Error(`Unknown owner "${owner}" for deck "${deck.name}"`);

      await prisma.$transaction(async (tx) => {
        const owned = await tx.userCard.findMany({ where: { userId: user.id } });
        const ownedQty = new Map(owned.map((o) => [o.cardId, o.qty]));

        for (const { cardId, qty } of deckCards) {
          if ((ownedQty.get(cardId) ?? 0) >= qty) continue;
          await tx.userCard.upsert({
            where: { userId_cardId: { userId: user.id, cardId } },
            create: { userId: user.id, cardId, qty },
            update: { qty },
          });
        }

        const existing = await tx.deck.findFirst({ where: { userId: user.id, name: deck.name } });
        if (existing) {
          await tx.deckCard.deleteMany({ where: { deckId: existing.id } });
          await tx.deck.update({
            where: { id: existing.id },
            data: { cards: { create: deckCards } },
          });
        } else {
          await tx.deck.create({
            data: { name: deck.name, userId: user.id, cards: { create: deckCards } },
          });
        }
      });

      console.log(`   ${deck.name} → ${owner}`);
    }
  }

  console.log("✅ Decks successfully seeded.");
}
