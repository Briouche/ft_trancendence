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

/**
 * Counts one attempt for `key` and tells whether it is still allowed.
 *
 * @param key    What is being limited, e.g. `login:ip:1.2.3.4`.
 * @param limit  At most `max` attempts per `windowMs` milliseconds.
 * @returns false once the limit is reached, until the window expires.
 */
export function rateLimit(key: string, limit: { max: number; windowMs: number }): boolean {
  const now = Date.now();

  if (++callsSinceSweep >= SWEEP_EVERY) {
    callsSinceSweep = 0;
    sweep(now);
  }

  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + limit.windowMs });
    return true;
  }

  current.count += 1;
  return current.count <= limit.max;
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
