import "server-only";

import { Redis } from "ioredis";
import { Emitter } from "@socket.io/redis-emitter";

// Publishes socket.io events straight into the socket-server's redis adapter channel, so the
// Next.js app can push live events (chat messages) after it has validated and persisted them —
// clients never relay these events themselves, which would let them skip those checks.
// Global singleton for the same hot-reload reason as lib/prisma.ts.
const emitterSingleton = () => {
  const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");
  // Without a listener, ioredis's "error" event is fatal to the process (see socket-server/redis.js).
  redis.on("error", (err) => console.error(`[Redis:emitter] ${err.name} - ${err.message}`));
  return new Emitter(redis);
};

declare global {
  var socketEmitterGlobal: ReturnType<typeof emitterSingleton> | undefined;
}

const socketEmitter = globalThis.socketEmitterGlobal ?? emitterSingleton();

export default socketEmitter;

if (process.env.NODE_ENV !== "production") {
  globalThis.socketEmitterGlobal = socketEmitter;
}

// Must match userRoom() in socket-server/handlers/connection.js.
export function userRoom(userId: number) {
  return `user:${userId}`;
}
