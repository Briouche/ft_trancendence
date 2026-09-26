import "server-only";

import { redis } from "@/lib/redis";
import type { Presence } from "@/lib/presenceTypes";

// Online presence, read from Redis. Written by the other services:
// - socket-server keeps HASH `presence:online` = { userId: open connection count };
// - game_engine keeps SET `presence:ingame` = ids of users currently seated in a match.
// Keep these key names in sync with socket-server/index.js and game_engine/srcs/presence.ts.

export type { Presence };

export const PRESENCE_ONLINE_KEY = "presence:online";
export const PRESENCE_INGAME_KEY = "presence:ingame";

/**
 * Presence of each requested user. Never throws: if Redis is unreachable everyone reads as
 * offline, which only affects a status dot.
 */
export async function getPresence(userIds: number[]): Promise<Map<number, Presence>> {
  const result = new Map<number, Presence>(userIds.map((id) => [id, "offline"]));
  if (userIds.length === 0) return result;

  try {
    const ids = userIds.map(String);
    const [counts, inGame] = await Promise.all([
      redis.hmget(PRESENCE_ONLINE_KEY, ...ids),
      redis.smismember(PRESENCE_INGAME_KEY, ...ids),
    ]);
    userIds.forEach((id, i) => {
      if (inGame[i] === 1) result.set(id, "in_game");
      else if (Number(counts[i]) > 0) result.set(id, "online");
    });
  } catch (err) {
    console.error("getPresence: Redis unavailable, reporting everyone offline:", err);
  }
  return result;
}

/** Ids of every user with at least one open connection (for the "online only" filter). */
export async function getOnlineUserIds(): Promise<number[]> {
  try {
    const [online, inGame] = await Promise.all([
      redis.hgetall(PRESENCE_ONLINE_KEY),
      redis.smembers(PRESENCE_INGAME_KEY),
    ]);
    const ids = new Set<number>(inGame.map(Number));
    for (const [id, count] of Object.entries(online)) if (Number(count) > 0) ids.add(Number(id));
    return [...ids];
  } catch (err) {
    console.error("getOnlineUserIds: Redis unavailable:", err);
    return [];
  }
}
