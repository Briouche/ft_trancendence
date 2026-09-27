import "server-only";

import prisma from "@/lib/prisma";
import { ACHIEVEMENT_CARD_BACKS, ACHIEVEMENT_CARD_BACK_HINTS } from "@/lib/cardBacks";

// The achievements of the game are its unlockable card backs: each one has a condition (first win
// in a mode, complete collection) and is granted by the code that detects it —
// game_engine/srcs/matchResults.ts after a match, lib/packs.ts when a pack completes the
// collection. This module only reports the progress towards each of them.

/** One card-back achievement as shown on /achievements. */
export type CardBackAchievement = {
  cardBack: number;
  rule: string;
  value: number;
  goal: number;
  unlocked: boolean;
};

/** Progress of a user towards every card-back achievement, in catalog order. */
export async function getCardBackAchievements(userId: number): Promise<CardBackAchievement[]> {
  const [user, owned, cards] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { winsVsPlayer: true, winsVsAiEasy: true, winsVsAiMedium: true, winsVsAiHard: true, unlockedCardBacks: true },
    }),
    prisma.userCard.findMany({ where: { userId }, select: { cardId: true, qty: true } }),
    prisma.card.findMany({ select: { id: true, qty: true } }),
  ]);

  // Collection progress in copies: each card counts up to its per-player maximum.
  const ownedQty = new Map(owned.map((o) => [o.cardId, o.qty]));
  const collectionGoal = cards.reduce((sum, c) => sum + c.qty, 0);
  const collectionValue = cards.reduce((sum, c) => sum + Math.min(c.qty, ownedQty.get(c.id) ?? 0), 0);

  const progress: Record<keyof typeof ACHIEVEMENT_CARD_BACKS, [number, number]> = {
    winVsPlayer: [user.winsVsPlayer, 1],
    winVsAiEasy: [user.winsVsAiEasy, 1],
    winVsAiMedium: [user.winsVsAiMedium, 1],
    winVsAiHard: [user.winsVsAiHard, 1],
    fullCollection: [collectionValue, collectionGoal],
  };

  return (Object.entries(ACHIEVEMENT_CARD_BACKS) as [keyof typeof ACHIEVEMENT_CARD_BACKS, number][]).map(([key, cardBack]) => {
    const [value, goal] = progress[key];
    return {
      cardBack,
      rule: ACHIEVEMENT_CARD_BACK_HINTS[cardBack],
      value: Math.min(value, goal),
      goal,
      unlocked: user.unlockedCardBacks.includes(cardBack),
    };
  });
}

/** Card backs earned through achievements, for a public profile. */
export async function getEarnedCardBacks(userId: number): Promise<{ cardBack: number; rule: string }[]> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { unlockedCardBacks: true } });
  return Object.values(ACHIEVEMENT_CARD_BACKS)
    .filter((cardBack) => user.unlockedCardBacks.includes(cardBack))
    .map((cardBack) => ({ cardBack, rule: ACHIEVEMENT_CARD_BACK_HINTS[cardBack] }));
}
