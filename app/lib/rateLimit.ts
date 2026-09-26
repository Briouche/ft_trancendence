import "server-only";

import { headers } from "next/headers";

// In-memory fixed-window rate limiter for the authentication actions.
//
// In-memory is enough here: the app runs as a single Next.js process. With several instances,
// this would move to Redis (already in the stack) so the counters are shared.

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();

// Drop expired windows once in a while so the map can't grow without bound.
const SWEEP_EVERY = 1000;
let callsSinceSweep = 0;

function sweep(now: number): void {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
}

function currentWindow(key: string, now: number): Window | undefined {
  const window = windows.get(key);
  return window && window.resetAt > now ? window : undefined;
}

/**
 * Counts one attempt for `key` and tells whether it is still allowed.
 *
 * @param key    What is being limited, e.g. `chat:12`.
 * @param limit  At most `max` attempts per `windowMs` milliseconds.
 * @returns false once the limit is reached, until the window expires.
 */
export function rateLimit(key: string, limit: { max: number; windowMs: number }): boolean {
  recordAttempt(key, limit);
  return (windows.get(key)?.count ?? 0) <= limit.max;
}

/** True when `key` already used up its attempts for the current window (counts nothing). */
export function isRateLimited(key: string, limit: { max: number; windowMs: number }): boolean {
  return (currentWindow(key, Date.now())?.count ?? 0) >= limit.max;
}

/**
 * Counts one attempt for `key` without checking it. Used with isRateLimited to count only what
 * should be limited, e.g. failed logins: successful ones must not lock anybody out.
 */
export function recordAttempt(key: string, limit: { max: number; windowMs: number }): void {
  const now = Date.now();

  if (++callsSinceSweep >= SWEEP_EVERY) {
    callsSinceSweep = 0;
    sweep(now);
  }

  const current = currentWindow(key, now);
  if (current) current.count += 1;
  else windows.set(key, { count: 1, resetAt: now + limit.windowMs });
}

/** Test helper: forgets every counter. */
export function resetRateLimits(): void {
  windows.clear();
}

/**
 * Client IP as seen by nginx. Only X-Real-IP is trusted: nginx overwrites it with the socket's
 * address, while X-Forwarded-For can be prefixed by the client itself.
 */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-real-ip") ?? "unknown";
}
