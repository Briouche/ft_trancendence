// Achievement catalog (titles, rules, rewards), importable from client components. Unlocking is
// server-side, in lib/achievements.ts; UserAchievement rows store which `key`s a user has.
//
// Rules of progression, as shown on the Achievements page:
// - each achievement has a goal on one statistic; reaching it unlocks the achievement for good;
// - unlocking grants its reward packs once (added to the user's unopened packs);
// - its badge (bronze / silver / gold) is then shown on the player's public profile.

/** Statistics an achievement can be measured on (computed in lib/achievements.ts). */
export type AchievementMetric =
  | "totalWins"
  | "matchesPlayed"
  | "pvpWins"
  | "hardAiWins"
  | "packsOpened"
  | "distinctCards"
  | "collectionComplete"
  | "friends"
  | "messagesSent"
  | "elo";

export type BadgeTier = "bronze" | "silver" | "gold";

export type AchievementDefinition = {
  key: string;
  title: string;
  description: string;
  metric: AchievementMetric;
  /** Value of `metric` at which the achievement unlocks. */
  goal: number;
  /** Value `metric` starts from, for the progress bar (Elo starts at 1000, not 0). */
  start?: number;
  tier: BadgeTier;
  /** Unopened packs granted on unlock. */
  rewardPacks: number;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { key: "first_victory", title: "First Blood", description: "Win your first match.", metric: "totalWins", goal: 1, tier: "bronze", rewardPacks: 1 },
  { key: "veteran", title: "Veteran", description: "Play 10 matches.", metric: "matchesPlayed", goal: 10, tier: "silver", rewardPacks: 1 },
  { key: "duelist", title: "Duelist", description: "Win 5 matches against other players.", metric: "pvpWins", goal: 5, tier: "gold", rewardPacks: 2 },
  { key: "machine_breaker", title: "Machine Breaker", description: "Beat the AI in Hard difficulty.", metric: "hardAiWins", goal: 1, tier: "gold", rewardPacks: 2 },
  { key: "pack_rat", title: "Pack Rat", description: "Open 10 card packs.", metric: "packsOpened", goal: 10, tier: "bronze", rewardPacks: 1 },
  { key: "collector", title: "Collector", description: "Own 40 different cards.", metric: "distinctCards", goal: 40, tier: "silver", rewardPacks: 1 },
  { key: "completionist", title: "Completionist", description: "Complete the whole card collection.", metric: "collectionComplete", goal: 1, tier: "gold", rewardPacks: 3 },
  { key: "social_butterfly", title: "Social Butterfly", description: "Have 3 friends.", metric: "friends", goal: 3, tier: "bronze", rewardPacks: 1 },
  { key: "chatterbox", title: "Chatterbox", description: "Send 20 chat messages.", metric: "messagesSent", goal: 20, tier: "bronze", rewardPacks: 1 },
  { key: "rising_star", title: "Rising Star", description: "Reach 1100 Elo.", metric: "elo", goal: 1100, start: 1000, tier: "silver", rewardPacks: 2 },
];

export const ACHIEVEMENTS_BY_KEY = new Map(ACHIEVEMENTS.map((a) => [a.key, a]));

/** Progress towards an achievement, as a fraction between 0 and 1. */
export function progressFraction(definition: AchievementDefinition, value: number): number {
  const start = definition.start ?? 0;
  const span = definition.goal - start;
  return span <= 0 ? 1 : Math.min(1, Math.max(0, (value - start) / span));
}

/** One achievement as returned by GET /api/achievements. */
export type AchievementStatus = AchievementDefinition & {
  value: number;
  unlockedAt: string | null;
};
