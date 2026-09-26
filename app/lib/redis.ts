import "server-only";

import { Redis } from "ioredis";
import { Emitter } from "@socket.io/redis-emitter";

// Redis connection of the Next.js server, used for two things:
// - reading presence (who is online / in a match), written by socket-server and game_engine;
// - pushing real-time events to browsers through socket-server, via the socket.io Redis emitter
//   (socket-server's Redis adapter picks up anything published this way, so the app never needs
//   a socket connection of its own).

const createRedis = () =>
  new Redis(process.env.REDIS_URL ?? "redis://redis:6379", {
    // Fail fast instead of queueing forever when Redis is down: presence then reads as
    // "offline" and a real-time push is skipped, but the HTTP request itself still succeeds.
    maxRetriesPerRequest: 1,
    lazyConnect: false,
  });

declare global {
  var redisGlobal: Redis | undefined;
}

/** Shared connection (kept on globalThis in dev so hot reloads don't open a new one each time). */
export const redis = globalThis.redisGlobal ?? createRedis();
if (process.env.NODE_ENV !== "production") globalThis.redisGlobal = redis;

/** socket.io emitter: `io.to("user:12").emit(...)` from outside the socket server. */
export const io = new Emitter(redis);
