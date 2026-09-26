import { describe, expect, it, vi } from "vitest";

// matchResults imports the Prisma client; these tests only cover the pure Elo maths.
vi.mock("../srcs/db", () => ({ prisma: {} }));
const { eloDeltas, ELO_K_FACTOR } = await import("../srcs/matchResults");

describe("eloDeltas", () => {
  it("is zero-sum", () => {
    const d = eloDeltas(1200, 1000);
    expect(d.winner + d.loser).toBe(0);
  });

  it("gives K/2 between equal players", () => {
    expect(eloDeltas(1000, 1000)).toEqual({ winner: ELO_K_FACTOR / 2, loser: -ELO_K_FACTOR / 2 });
  });

  it("rewards an upset more than an expected win", () => {
    expect(eloDeltas(1000, 1400).winner).toBeGreaterThan(eloDeltas(1400, 1000).winner);
  });

  it("never exceeds K", () => {
    expect(eloDeltas(0, 3000).winner).toBeLessThanOrEqual(ELO_K_FACTOR);
  });
});
