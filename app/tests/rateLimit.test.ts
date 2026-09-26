import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimit, resetRateLimits } from "@/lib/rateLimit";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

describe("rateLimit", () => {
  afterEach(() => {
    resetRateLimits();
    vi.useRealTimers();
  });

  it("allows `max` attempts per window, then refuses", () => {
    const limit = { max: 3, windowMs: 1000 };
    expect([1, 2, 3, 4].map(() => rateLimit("k", limit))).toEqual([true, true, true, false]);
  });

  it("counts keys independently", () => {
    const limit = { max: 1, windowMs: 1000 };
    expect(rateLimit("a", limit)).toBe(true);
    expect(rateLimit("b", limit)).toBe(true);
    expect(rateLimit("a", limit)).toBe(false);
  });

  it("opens a new window once the previous one expired", () => {
    vi.useFakeTimers();
    const limit = { max: 1, windowMs: 1000 };
    expect(rateLimit("k", limit)).toBe(true);
    expect(rateLimit("k", limit)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit("k", limit)).toBe(true);
  });
});

describe("isRateLimited / recordAttempt", () => {
  afterEach(() => resetRateLimits());

  it("only counts what is recorded (e.g. failed logins)", async () => {
    const { isRateLimited, recordAttempt } = await import("@/lib/rateLimit");
    const limit = { max: 2, windowMs: 1000 };
    expect(isRateLimited("fail", limit)).toBe(false);
    recordAttempt("fail", limit);
    expect(isRateLimited("fail", limit)).toBe(false);
    recordAttempt("fail", limit);
    expect(isRateLimited("fail", limit)).toBe(true);
  });
});
