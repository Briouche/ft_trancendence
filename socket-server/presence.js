import { redis } from "./redis.js";

const ONLINE_USERS_META_KEY = "online_users_meta";

function userSocketsKey(userId) {
  return `user_sockets:${userId}`;
}

// Adds this tab's socket to the user's socket set and (re)stamps their presence metadata.
export async function registerUserSocket(userId, username, socketId) {
  await redis.sadd(userSocketsKey(userId), socketId);
  await redis.hset(ONLINE_USERS_META_KEY, userId.toString(), JSON.stringify({ userId, username }));
}

// Removes this tab's socket, and only clears the user's presence metadata once no
// sockets remain for them (they may still have other tabs/devices connected).
export async function unregisterUserSocket(userId, socketId) {
  const userKey = userSocketsKey(userId);
  await redis.srem(userKey, socketId);

  const remainingSockets = await redis.scard(userKey);
  if (remainingSockets === 0) {
    await redis.hdel(ONLINE_USERS_META_KEY, userId.toString());
  }
}

// Clears every presence key left by a previous run (its sockets are gone), so nobody stays
// "online" forever through a stale socket id.
export async function resetPresence() {
  const socketKeys = [];
  for await (const keys of redis.scanStream({ match: userSocketsKey("*") })) socketKeys.push(...keys);
  await redis.del(ONLINE_USERS_META_KEY, ...socketKeys);
}

export async function getActiveUsers() {
  const rawUsers = await redis.hgetall(ONLINE_USERS_META_KEY);
  return Object.values(rawUsers)
    .map((u) => {
      try {
        return JSON.parse(u);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

export async function broadcastPresence(io) {
  try {
    const activeUsers = await getActiveUsers();
    io.emit("presence:update", activeUsers);
  } catch (err) {
    console.error("[Socket] Failed to broadcast presence:", err);
  }
}
