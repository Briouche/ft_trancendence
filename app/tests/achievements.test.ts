import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, ACHIEVEMENTS_BY_KEY, progressFraction } from "@/lib/achievementCatalog";

describe("achievement catalog", () => {
  it("has unique keys and positive rewards", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.key)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) expect(a.rewardPacks).toBeGreaterThan(0);
  });

  it("uses every badge tier", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.tier))).toEqual(new Set(["bronze", "silver", "gold"]));
  });
});

describe("progressFraction", () => {
  const veteran = ACHIEVEMENTS_BY_KEY.get("veteran")!;
  const risingStar = ACHIEVEMENTS_BY_KEY.get("rising_star")!;

  it("is value / goal, clamped to [0, 1]", () => {
    expect(progressFraction(veteran, 0)).toBe(0);
    expect(progressFraction(veteran, 4)).toBe(0.4);
    expect(progressFraction(veteran, 25)).toBe(1);
  });

  it("measures from the starting value when there is one (Elo starts at 1000)", () => {
    expect(progressFraction(risingStar, 1000)).toBe(0);
    expect(progressFraction(risingStar, 1050)).toBe(0.5);
    expect(progressFraction(risingStar, 900)).toBe(0);
  });
});
