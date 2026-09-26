import { Prisma, PrismaClient } from "@prisma/client";
import { ACHIEVEMENT_CARD_BACKS } from "./cardBacks";

// Pack opening: weighted rarity draws, legendary pity, collection completion reward.

const CARDS_PER_PACK = 8;
const PACKS_BEFORE_GUARANTEED_LEGENDARY = 5;
const LEGENDARY_RARITY = "Légendaire";

const RARITY_WEIGHTS: Record<string, number> = {
  "Commune": 40,
  "Rare": 15,
  "Épique": 10,
  "Légendaire": 2,
};

interface DrawableCard {
  id: string;
  rarity: string;
  remaining: number;
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

// One slot: draws a rarity, then a card the player can still obtain within it.
function drawOneSlot(pool: DrawableCard[]): DrawableCard | null {
  const available = pool.filter((c) => c.remaining > 0);
  const rarities = [...new Set(available.map((c) => c.rarity))];
  if (rarities.length === 0) return null;

  const options = rarities.map((r) => ({ tier: r, weight: RARITY_WEIGHTS[r] ?? 1 }));
  const picked = pickWeighted(options, (o) => o.weight);

  const candidates = available.filter((c) => c.rarity === picked.tier);
  const card = candidates[Math.floor(Math.random() * candidates.length)];
  card.remaining -= 1;
  return card;
}

/** Thrown by openPack when the user has no unopened pack left. */
export class NoPackError extends Error {
  constructor() {
    super("No pack available.");
  }
}

/**
 * Opens one of the user's unopened packs: draws CARDS_PER_PACK cards (never more copies of a card
 * than the catalog allows per player), applies the legendary pity timer, adds the cards to the
 * collection and unlocks the "full collection" card back when this pack completes it.
 * Everything happens in one transaction.
 *
 * @throws NoPackError when there is no pack left to open.
 */
export async function openPack(prisma: PrismaClient, userId: number) {
  return prisma.$transaction(async (tx) => {
    // Take the pack first, as one conditional UPDATE: it both checks there is a pack left and
    // locks the user row until commit. A second concurrent opening (double click, two tabs) then
    // waits here and re-checks against the decremented count, instead of both reading "1 pack
    // left" and each drawing a full pack from it.
    const taken = await tx.user.updateMany({
      where: { id: userId, unopenedPacks: { gt: 0 } },
      data: { unopenedPacks: { decrement: 1 }, packsOpened: { increment: 1 } },
    });
    if (taken.count === 0) {
      throw new NoPackError();
    }

    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { pityCounter: true, unlockedCardBacks: true },
    });

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

    const drawnCards: DrawableCard[] = [];

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
      const card = drawOneSlot(pool);
      if (!card) break;
      drawnCards.push(card);
      slotsFilled += 1;
    }

    const gotLegendary = drawnCards.some((c) => c.rarity === LEGENDARY_RARITY);

    const countByCard = new Map<string, number>();
    for (const c of drawnCards) {
      countByCard.set(c.id, (countByCard.get(c.id) ?? 0) + 1);
    }

    const fullCollectionIndex = ACHIEVEMENT_CARD_BACKS.fullCollection;
    const alreadyHasFullCollectionBack = user.unlockedCardBacks.includes(fullCollectionIndex);
    const justCompletedCollection = !alreadyHasFullCollectionBack && allCards.every(
      (card) => (ownedQtyByCard.get(card.id) ?? 0) + (countByCard.get(card.id) ?? 0) >= card.qty
    );

    const newlyUnlockedBacks = justCompletedCollection ? [fullCollectionIndex] : [];

    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: {
        pityCounter: gotLegendary ? 0 : { increment: 1 },
        ...(newlyUnlockedBacks.length > 0 && {
          unlockedCardBacks: { push: newlyUnlockedBacks },
        }),
      },
      select: { unopenedPacks: true, pityCounter: true },
    });

    // One bulk upsert instead of one sequential round trip per distinct drawn card (up to
    // CARDS_PER_PACK) — keeps this transaction's row locks held for as little time as possible.
    if (countByCard.size > 0) {
      const rows = Prisma.join(
        [...countByCard].map(([cardId, count]) => Prisma.sql`(${userId}, ${cardId}, ${count})`)
      );
      await tx.$executeRaw`
        INSERT INTO "UserCard" ("userId", "cardId", "qty")
        VALUES ${rows}
        ON CONFLICT ("userId", "cardId")
        DO UPDATE SET "qty" = "UserCard"."qty" + EXCLUDED."qty"
      `;
    }

    const cardsById = new Map(allCards.map((c) => [c.id, c]));
    return {
      cards: drawnCards.map((c) => cardsById.get(c.id)!),
      unopenedPacks: updatedUser.unopenedPacks,
      pityCounter: updatedUser.pityCounter,
      unlockedCardBacks: newlyUnlockedBacks,
    };
  });
}
