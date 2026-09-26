import "server-only";

import prisma from "@/lib/prisma";
import { ACHIEVEMENT_CARD_BACKS } from "@/lib/cardBacks";
import {
  ACHIEVEMENTS,
  ACHIEVEMENTS_BY_KEY,
  type AchievementDefinition,
  type AchievementMetric,
  type AchievementStatus,
} from "@/lib/achievementCatalog";

// Achievement unlocking. Statistics are recomputed from the database each time (no separate
// counters that could drift), and whatever newly reached its goal is persisted with its reward.

type Stats = Record<AchievementMetric, number>;

/** Current value of every achievement metric for a user. */
export async function computeStats(userId: number): Promise<Stats> {
  const [user, matchesPlayed, distinctCards, friends, messagesSent] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        winsVsAiEasy: true,
        winsVsAiMedium: true,
        winsVsAiHard: true,
        winsVsPlayer: true,
        packsOpened: true,
        elo: true,
        unlockedCardBacks: true,
      },
    }),
    prisma.matchPlayer.count({ where: { userId } }),
    prisma.userCard.count({ where: { userId, qty: { gt: 0 } } }),
    prisma.friendship.count({
      where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    }),
    prisma.message.count({ where: { senderId: userId } }),
  ]);

  return {
    totalWins: user.winsVsAiEasy + user.winsVsAiMedium + user.winsVsAiHard + user.winsVsPlayer,
    matchesPlayed,
    pvpWins: user.winsVsPlayer,
    hardAiWins: user.winsVsAiHard,
    packsOpened: user.packsOpened,
    distinctCards,
    // The "full collection" card back is granted by lib/packs.ts at the moment it happens.
    collectionComplete: user.unlockedCardBacks.includes(ACHIEVEMENT_CARD_BACKS.fullCollection) ? 1 : 0,
    friends,
    messagesSent,
    elo: user.elo,
  };
}

/**
 * Unlocks every achievement whose goal is now reached and grants its reward packs.
 *
 * Safe to call concurrently (two tabs, or the hub and a pack opening at once): each unlock is an
 * insert that skips duplicates, and only the call whose insert actually created the row grants
 * the reward, so packs can never be granted twice.
 *
 * @returns the achievements unlocked by this call (for a "new achievement" notification).
 */
export async function evaluateAchievements(userId: number): Promise<AchievementDefinition[]> {
  const [stats, owned] = await Promise.all([
    computeStats(userId),
    prisma.userAchievement.findMany({ where: { userId }, select: { key: true } }),
  ]);
  const ownedKeys = new Set(owned.map((o) => o.key));
  const reached = ACHIEVEMENTS.filter((a) => !ownedKeys.has(a.key) && stats[a.metric] >= a.goal);
  if (reached.length === 0) return [];

  return prisma.$transaction(async (tx) => {
    const unlocked: AchievementDefinition[] = [];
    for (const achievement of reached) {
      const { count } = await tx.userAchievement.createMany({
        data: [{ userId, key: achievement.key }],
        skipDuplicates: true,
      });
      if (count === 1) unlocked.push(achievement);
    }

    const packs = unlocked.reduce((sum, a) => sum + a.rewardPacks, 0);
    if (packs > 0) {
      await tx.user.update({ where: { id: userId }, data: { unopenedPacks: { increment: packs } } });
    }
    return unlocked;
  });
}

/** Every achievement with the user's progress and unlock date (evaluates first). */
export async function getAchievementStatuses(userId: number): Promise<{
  achievements: AchievementStatus[];
  newlyUnlocked: string[];
}> {
  const newlyUnlocked = await evaluateAchievements(userId);
  const [stats, rows] = await Promise.all([
    computeStats(userId),
    prisma.userAchievement.findMany({ where: { userId } }),
  ]);
  const unlockedAt = new Map(rows.map((r) => [r.key, r.unlockedAt.toISOString()]));

  return {
    achievements: ACHIEVEMENTS.map((a) => ({ ...a, value: stats[a.metric], unlockedAt: unlockedAt.get(a.key) ?? null })),
    newlyUnlocked: newlyUnlocked.map((a) => a.key),
  };
}

/** Badges (unlocked achievements) of a user, most recent first, for their public profile. */
export async function getBadges(userId: number) {
  const rows = await prisma.userAchievement.findMany({ where: { userId }, orderBy: { unlockedAt: "desc" } });
  return rows.flatMap((r) => {
    const definition = ACHIEVEMENTS_BY_KEY.get(r.key);
    return definition ? [{ key: r.key, title: definition.title, tier: definition.tier, unlockedAt: r.unlockedAt.toISOString() }] : [];
  });
}
