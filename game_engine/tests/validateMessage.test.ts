import { describe, expect, it } from "vitest";
import { isDeckId, isDifficulty, isWellFormed } from "../srcs/socket/validateMessage";

describe("client message validation", () => {
  it("accepts only known difficulties", () => {
    expect(isDifficulty("facile")).toBe(true);
    expect(isDifficulty("impossible")).toBe(false);
    expect(isDifficulty("__proto__")).toBe(false);
    expect(isDifficulty(3)).toBe(false);
  });

  it("accepts only positive integer deck ids", () => {
    expect(isDeckId(4)).toBe(true);
    expect([0, -1, 1.5, "4", null, NaN].some(isDeckId)).toBe(false);
  });

  it("checks the shape of in-game moves", () => {
    expect(isWellFormed({ type: "playCard", cardId: "c1" })).toBe(true);
    expect(isWellFormed({ type: "playCard", cardId: "c1", boardIndex: 2 })).toBe(true);
    expect(isWellFormed({ type: "playCard", cardId: "c1", boardIndex: "2" })).toBe(false);
    expect(isWellFormed({ type: "attack", attackerId: "a" })).toBe(false);
    expect(isWellFormed({ type: "targetChoice", targetId: null })).toBe(true);
    expect(isWellFormed(null)).toBe(false);
    expect(isWellFormed("endTurn")).toBe(false);
  });
});
