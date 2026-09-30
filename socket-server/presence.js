import { redis } from "./redis.js";

const ONLINE_USERS_META_KEY = "online_users_meta";
const USER_SOCKETS_PREFIX = "user_sockets:";

function userSocketsKey(userId) {
  return `${USER_SOCKETS_PREFIX}${userId}`;
}

// Removing the socket and clearing the metadata once none are left has to be one atomic step:
// as separate commands, a tab connecting between the SCARD and the HDEL (its SADD + HSET landing
// in that gap) would have its user's metadata deleted and show as offline while connected.
redis.defineCommand("unregisterUserSocket", {
  numberOfKeys: 2,
  lua: `
    redis.call("SREM", KEYS[1], ARGV[1])
    if redis.call("SCARD", KEYS[1]) == 0 then
      redis.call("HDEL", KEYS[2], ARGV[2])
    end
  `,
});

// Presence lives in Redis, which outlives this process (redis_data volume): if the server exits
// without running its disconnect handlers (crash, restart, redeploy), every user it had connected
// would otherwise stay "online" forever. Must run before the server accepts connections, so it
// can't wipe a socket that has already reconnected. Assumes a single socket-server replica — with
// several, this would also clear the other replicas' users.
export async function resetPresence() {
  const stream = redis.scanStream({ match: `${USER_SOCKETS_PREFIX}*`, count: 100 });
  for await (const keys of stream) {
    if (keys.length > 0) await redis.del(...keys);
  }
  await redis.del(ONLINE_USERS_META_KEY);
}

// Adds this tab's socket to the user's socket set and (re)stamps their presence metadata.
export async function registerUserSocket(userId, username, socketId) {
  await redis
    .multi()
    .sadd(userSocketsKey(userId), socketId)
    .hset(ONLINE_USERS_META_KEY, userId.toString(), JSON.stringify({ userId, username }))
    .exec();
}

// Removes this tab's socket, and only clears the user's presence metadata once no
// sockets remain for them (they may still have other tabs/devices connected).
export async function unregisterUserSocket(userId, socketId) {
  await redis.unregisterUserSocket(userSocketsKey(userId), ONLINE_USERS_META_KEY, socketId, userId.toString());
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
