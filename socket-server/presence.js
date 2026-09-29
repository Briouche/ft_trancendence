import { redis } from "./redis.js";

// Online presence in Redis: SET `user_sockets:<id>` holds the ids of the user's open sockets
// (several tabs or devices), so the user is online while it is non-empty. Keep the key name in
// sync with app/lib/presence.ts.

export function userSocketsKey(userId) {
  return `user_sockets:${userId}`;
}

/** Adds a socket to the user's set; true when it is their first one (they just came online). */
export async function addUserSocket(userId, socketId) {
  await redis.sadd(userSocketsKey(userId), socketId);
  return (await redis.scard(userSocketsKey(userId))) === 1;
}

/** Removes a socket from the user's set; true when it was their last one (they went offline). */
export async function removeUserSocket(userId, socketId) {
  await redis.srem(userSocketsKey(userId), socketId);
  return (await redis.scard(userSocketsKey(userId))) === 0;
}

/** Ids among `userIds` that currently have at least one open socket. */
export async function onlineAmong(userIds) {
  if (userIds.length === 0) return [];
  const pipeline = redis.pipeline();
  for (const id of userIds) pipeline.exists(userSocketsKey(id));
  const results = await pipeline.exec();
  return userIds.filter((_, i) => results[i][1] === 1);
}

/**
 * Clears presence left by a previous run (its sockets are gone), so nobody stays "online"
 * forever through a stale socket id. Assumes a single socket-server instance, which is how the
 * stack is deployed.
 */
export async function resetPresence() {
  const keys = [];
  for await (const batch of redis.scanStream({ match: userSocketsKey("*") })) keys.push(...batch);
  if (keys.length) await redis.del(...keys);
}
