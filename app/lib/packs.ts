import { PrismaClient } from "@prisma/client";

const CARDS_PER_PACK = 8;
const PACKS_BEFORE_GUARANTEED_LEGENDARY = 5;
const LEGENDARY_RARITY = "Légendaire";

// Poids relatifs de tirage par rareté (avant application de la pity légendaire).
const RARITY_WEIGHTS: Record<string, number> = {
  "Commune": 40,
  "Peu commune": 25,
  "Rare": 15,
  "Épique": 10,
  "Légendaire": 2,
};

interface DrawableCard {
  id: string;
  rarity: string;
  remaining: number; // combien de fois cette carte peut encore être tirée par ce joueur
}

function pickWeighted<T>(items: T[], weight: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

function drawOneCard(pool: DrawableCard[]): DrawableCard | null {
  const available = pool.filter((c) => c.remaining > 0);
  if (available.length === 0) return null;

  const rarities = [...new Set(available.map((c) => c.rarity))];
  const rarity = pickWeighted(rarities, (r) => RARITY_WEIGHTS[r] ?? 1);

  const candidates = available.filter((c) => c.rarity === rarity);
  const card = candidates[Math.floor(Math.random() * candidates.length)];
  card.remaining -= 1;
  return card;
}

export async function openPack(prisma: PrismaClient, userId: number) {
  return prisma.$transaction(async (tx) => {
    // select explicite : la table User réelle n'a pas de colonne `name` (contrairement au schema
    // Prisma) — un findUnique sans select tente de la lire et fait planter la requête.
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, unopenedPacks: true, pityCounter: true },
    });

    if (user.unopenedPacks <= 0) {
      throw new Error("Aucun paquet disponible pour cet utilisateur.");
    }

    const [allCards, owned] = await Promise.all([
      tx.card.findMany(),
      tx.userCard.findMany({ where: { userId } }),
    ]);
    const ownedQtyByCard = new Map(owned.map((o) => [o.cardId, o.qty]));

    const pool: DrawableCard[] = allCards.map((card) => ({
      id: card.id,
      rarity: card.rarity,
      remaining: card.qty - (ownedQtyByCard.get(card.id) ?? 0),
    }));

    const drawn: DrawableCard[] = [];

    // Pity: si le joueur n'a pas eu de légendaire depuis 5 paquets, on en force une
    // (si le joueur ne peut plus en recevoir - toutes déjà possédées au max -, on laisse tomber).
    const mustForceLegendary =
      user.pityCounter >= PACKS_BEFORE_GUARANTEED_LEGENDARY - 1;

    if (mustForceLegendary) {
      const legendaryPool = pool.filter(
        (c) => c.rarity === LEGENDARY_RARITY && c.remaining > 0
      );
      if (legendaryPool.length > 0) {
        const forced =
          legendaryPool[Math.floor(Math.random() * legendaryPool.length)];
        forced.remaining -= 1;
        drawn.push(forced);
      }
    }

    while (drawn.length < CARDS_PER_PACK) {
      const card = drawOneCard(pool);
      if (!card) break; // collection du joueur entièrement complétée
      drawn.push(card);
    }

    const gotLegendary = drawn.some((c) => c.rarity === LEGENDARY_RARITY);

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        unopenedPacks: { decrement: 1 },
        pityCounter: gotLegendary ? 0 : { increment: 1 },
      },
      select: { unopenedPacks: true, pityCounter: true },
    });

    const countByCard = new Map<string, number>();
    for (const c of drawn) {
      countByCard.set(c.id, (countByCard.get(c.id) ?? 0) + 1);
    }

    for (const [cardId, count] of countByCard) {
      await tx.userCard.upsert({
        where: { userId_cardId: { userId, cardId } },
        update: { qty: { increment: count } },
        create: { userId, cardId, qty: count },
      });
    }

    const cardsById = new Map(allCards.map((c) => [c.id, c]));
    return {
      cards: drawn.map((c) => cardsById.get(c.id)!),
      unopenedPacks: updatedUser.unopenedPacks,
      pityCounter: updatedUser.pityCounter,
    };
  });
}
