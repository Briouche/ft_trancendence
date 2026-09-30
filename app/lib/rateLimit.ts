import "server-only";

import { headers } from "next/headers";

// Sliding-window rate limiter kept in memory. The app runs as a single Next.js process (one
// container), so a per-process map is exact; several replicas would need Redis instead.

export type RateLimit = { max: number; windowMs: number };

const attempts = new Map<string, number[]>();

// Bounds memory if many distinct keys are hit: entries whose timestamps all expired are dropped.
const SWEEP_EVERY = 500;
let callsSinceSweep = 0;

function recent(key: string, windowMs: number, now: number): number[] {
  const kept = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);
  if (kept.length) attempts.set(key, kept);
  else attempts.delete(key);
  return kept;
}

function sweep(now: number): void {
  if (++callsSinceSweep < SWEEP_EVERY) return;
  callsSinceSweep = 0;
  // An hour covers every window used in the app.
  for (const key of attempts.keys()) recent(key, 60 * 60 * 1000, now);
}

/** Whether `key` already reached its limit, without counting a new attempt. */
export function isRateLimited(key: string, limit: RateLimit, now = Date.now()): boolean {
  return recent(key, limit.windowMs, now).length >= limit.max;
}

/** Counts one attempt for `key`. */
export function recordAttempt(key: string, limit: RateLimit, now = Date.now()): void {
  sweep(now);
  const list = recent(key, limit.windowMs, now);
  list.push(now);
  attempts.set(key, list);
}

/** Counts one attempt and says whether it is allowed (false once the limit is reached). */
export function rateLimit(key: string, limit: RateLimit, now = Date.now()): boolean {
  if (isRateLimited(key, limit, now)) return false;
  recordAttempt(key, limit, now);
  return true;
}

/** Client IP as seen by nginx (X-Real-IP), the only hop allowed to reach the app. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
