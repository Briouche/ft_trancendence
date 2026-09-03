import { PrismaClient } from "@prisma/client";
import { CARD_BACK_COUNT } from "./cardBacks";

const CARDS_PER_PACK = 8;
const PACKS_BEFORE_GUARANTEED_LEGENDARY = 5;
const LEGENDARY_RARITY = "Légendaire";

// Tag interne (pas une vraie rareté de Card) : un dos de carte se tire à la place d'une carte,
// dans le même tirage pondéré, avec le même poids qu'une légendaire.
const CARD_BACK_TIER = "__cardback__";

// Poids relatifs de tirage par rareté (avant application de la pity légendaire). "Peu commune"
// retirée du jeu ; le tier dos de carte est injecté séparément ci-dessous (même poids que Légendaire).
const RARITY_WEIGHTS: Record<string, number> = {
  "Commune": 40,
  "Rare": 15,
  "Épique": 10,
  "Légendaire": 2,
};
const CARD_BACK_WEIGHT = RARITY_WEIGHTS[LEGENDARY_RARITY];

interface DrawableCard {
  id: string;
  rarity: string;
  remaining: number; // combien de fois cette carte peut encore être tirée par ce joueur
}

type DrawResult =
  | { type: "card"; card: DrawableCard }
  | { type: "cardBack"; index: number };

function pickWeighted<T>(items: T[], weight: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + weight(item), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= weight(item);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

// Un slot de paquet : tire une rareté (carte) OU le tier dos de carte (si l'un des deux
// existe encore pour ce joueur), puis un élément concret dedans. `lockedCardBacks` est mutée
// (l'index tiré en est retiré) pour ne jamais offrir deux fois le même dos dans un seul paquet.
function drawOneSlot(
  pool: DrawableCard[],
  lockedCardBacks: number[]
): DrawResult | null {
  const available = pool.filter((c) => c.remaining > 0);
  const rarities = [...new Set(available.map((c) => c.rarity))];

  const options: { tier: string; weight: number }[] = rarities.map((r) => ({
    tier: r,
    weight: RARITY_WEIGHTS[r] ?? 1,
  }));
  if (lockedCardBacks.length > 0) {
    options.push({ tier: CARD_BACK_TIER, weight: CARD_BACK_WEIGHT });
  }
  if (options.length === 0) return null;

  const picked = pickWeighted(options, (o) => o.weight);

  if (picked.tier === CARD_BACK_TIER) {
    const i = Math.floor(Math.random() * lockedCardBacks.length);
    const [index] = lockedCardBacks.splice(i, 1);
    return { type: "cardBack", index };
  }

  const candidates = available.filter((c) => c.rarity === picked.tier);
  const card = candidates[Math.floor(Math.random() * candidates.length)];
  card.remaining -= 1;
  return { type: "card", card };
}

export async function openPack(prisma: PrismaClient, userId: number) {
  return prisma.$transaction(async (tx) => {
    // select explicite : la table User réelle n'a pas de colonne `name` (contrairement au schema
    // Prisma) — un findUnique sans select tente de la lire et fait planter la requête.
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, unopenedPacks: true, pityCounter: true, unlockedCardBacks: true },
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

    const lockedCardBacks = Array.from({ length: CARD_BACK_COUNT }, (_, i) => i).filter(
      (i) => !user.unlockedCardBacks.includes(i)
    );

    const drawnCards: DrawableCard[] = [];
    const drawnCardBacks: number[] = [];

    // Pity: si le joueur n'a pas eu de légendaire depuis 5 paquets, on en force une (toujours
    // une vraie carte, jamais un dos — la pity ne porte que sur les légendaires).
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
        drawnCards.push(forced);
      }
    }

    let slotsFilled = drawnCards.length;
    while (slotsFilled < CARDS_PER_PACK) {
      const result = drawOneSlot(pool, lockedCardBacks);
      if (!result) break; // collection + dos de carte entièrement complétés
      if (result.type === "card") drawnCards.push(result.card);
      else drawnCardBacks.push(result.index);
      slotsFilled += 1;
    }

    const gotLegendary = drawnCards.some((c) => c.rarity === LEGENDARY_RARITY);

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        unopenedPacks: { decrement: 1 },
        pityCounter: gotLegendary ? 0 : { increment: 1 },
        ...(drawnCardBacks.length > 0 && {
          unlockedCardBacks: { set: [...user.unlockedCardBacks, ...drawnCardBacks] },
        }),
      },
      select: { unopenedPacks: true, pityCounter: true },
    });

    const countByCard = new Map<string, number>();
    for (const c of drawnCards) {
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
      cards: drawnCards.map((c) => cardsById.get(c.id)!),
      unopenedPacks: updatedUser.unopenedPacks,
      pityCounter: updatedUser.pityCounter,
      unlockedCardBacks: drawnCardBacks,
    };
  });
}
