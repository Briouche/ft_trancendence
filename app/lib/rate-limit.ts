import { NextRequest } from "next/server";

/**
 * Simple in-memory, fixed-window rate limiter.
 *
 * CAVEAT: state lives in process memory. This is fine for a single
 * container/instance (matches the current docker-compose setup, which
 * runs one `app` container). If you ever scale `app` to multiple
 * replicas, each instance gets its own counters, so the effective limit
 * becomes (limit × number of instances). At that point, swap this out
 * for a shared store (e.g. Redis via @upstash/ratelimit) keyed the same
 * way — the call sites in the routes won't need to change.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpired(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** epoch ms when the current window resets */
  resetAt: number;
}

/**
 * Checks and increments a fixed-window counter for `key`.
 *
 * @param key unique id for the thing being limited, e.g. `login:ip:1.2.3.4`
 * @param limit max calls allowed within the window
 * @param windowMs window length in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  cleanupExpired(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    success: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}

/**
 * Best-effort client IP extraction.
 *
 * Requires the reverse proxy (nginx, per docker-compose) to set
 * X-Forwarded-For (or X-Real-IP) with the real client address. Without
 * that, every request looks like it comes from the proxy and this
 * degrades to a single shared bucket for all users — confirm your nginx
 * config sets one of these headers.
 */
export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

function retryAfterHeader(resetAt: number): Record<string, string> {
  return {
    "Retry-After": String(
      Math.max(1, Math.ceil((resetAt - Date.now()) / 1000)),
    ),
  };
}

export { retryAfterHeader };
