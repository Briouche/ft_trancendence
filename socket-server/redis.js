import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";

// ioredis emits "error" on every connection failure; with no listener, Node treats an
// unhandled "error" event as fatal and crashes the process. ioredis already retries the
// connection on its own, so logging is all this needs to do.
function logRedisErrors(client, label) {
  client.on("error", (err) => {
    console.error(`[Redis:${label}] ${err.name} - ${err.message}`);
  });
  return client;
}

// Dedicated pub/sub pair for socket.io's cross-replica broadcast (via @socket.io/redis-adapter).
export const pubClient = logRedisErrors(new Redis(REDIS_URL), "pub");
export const subClient = logRedisErrors(pubClient.duplicate(), "sub");

// Separate client for our own presence bookkeeping (SADD/HSET/etc) — a subscribed client
// can't run regular commands, so this must not be pubClient/subClient.
export const redis = logRedisErrors(new Redis(REDIS_URL), "main");
