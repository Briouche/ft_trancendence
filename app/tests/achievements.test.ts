import { describe, expect, it, vi } from "vitest";

// Fake database: 2 winsVsAiEasy, no other win, back 4 unlocked, 3 of the 4 collectible copies owned.
vi.mock("@/lib/prisma", () => ({
  default: {
    user: {
      findUniqueOrThrow: async () => ({
        winsVsPlayer: 0, winsVsAiEasy: 2, winsVsAiMedium: 0, winsVsAiHard: 0, unlockedCardBacks: [0, 1, 2, 4],
      }),
    },
    userCard: { findMany: async () => [{ cardId: "a", qty: 2 }, { cardId: "b", qty: 5 }] },
    card: { findMany: async () => [{ id: "a", qty: 2 }, { id: "b", qty: 1 }, { id: "c", qty: 1 }] },
  },
}));

const { getCardBackAchievements, getEarnedCardBacks } = await import("@/lib/achievements");
const { ACHIEVEMENT_CARD_BACKS } = await import("@/lib/cardBacks");

describe("card-back achievements", () => {
  it("lists one achievement per unlockable card back", async () => {
    const list = await getCardBackAchievements(1);
    expect(list.map((a) => a.cardBack)).toEqual(Object.values(ACHIEVEMENT_CARD_BACKS));
  });

  it("reports wins capped at the goal and the unlock state", async () => {
    const easy = (await getCardBackAchievements(1)).find((a) => a.cardBack === ACHIEVEMENT_CARD_BACKS.winVsAiEasy)!;
    expect(easy).toMatchObject({ value: 1, goal: 1, unlocked: true });
    const pvp = (await getCardBackAchievements(1)).find((a) => a.cardBack === ACHIEVEMENT_CARD_BACKS.winVsPlayer)!;
    expect(pvp).toMatchObject({ value: 0, goal: 1, unlocked: false });
  });

  it("measures the collection in copies, each card counting up to its maximum", async () => {
    const full = (await getCardBackAchievements(1)).find((a) => a.cardBack === ACHIEVEMENT_CARD_BACKS.fullCollection)!;
    // a: 2/2, b: min(5, 1) = 1/1, c: 0/1 → 3 / 4
    expect(full).toMatchObject({ value: 3, goal: 4, unlocked: false });
  });

  it("shows only the earned achievement backs on a profile", async () => {
    expect((await getEarnedCardBacks(1)).map((b) => b.cardBack)).toEqual([ACHIEVEMENT_CARD_BACKS.winVsAiEasy]);
  });
});
