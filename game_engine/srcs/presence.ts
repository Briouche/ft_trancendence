import { Redis } from "ioredis";
import { Emitter } from "@socket.io/redis-emitter";

// "In a match" presence. The chat server (socket-server) tracks who is online; this process adds
// who is currently seated in a match, in the Redis SET below, and notifies the clients watching
// those users through socket-server's rooms (`presence:<id>`), via the socket.io Redis emitter.
// Keep the key names in sync with app/lib/presence.ts and socket-server/index.js.

const ONLINE_KEY = "presence:online";
const INGAME_KEY = "presence:ingame";

const redis = new Redis(process.env.REDIS_URL ?? "redis://redis:6379", { maxRetriesPerRequest: 1 });
const emitter = new Emitter(redis);

// A failed Redis call only costs a stale status dot, never a match: log and carry on.
redis.on("error", err => console.error("presence: Redis error:", err.message));

/** Forgets the in-match set of a previous run (its matches died with it). Call once at boot. */
export async function resetInGamePresence(): Promise<void>
{
    await redis.del(INGAME_KEY).catch(err => console.error("presence: reset failed:", err));
}

/** Marks users as in a match (or not anymore) and tells whoever is watching them. */
export async function setInGame(userIds: number[], inGame: boolean): Promise<void>
{
    if (userIds.length === 0)
        return;
    try
    {
        const ids = userIds.map(String);
        if (inGame)
            await redis.sadd(INGAME_KEY, ...ids);
        else
            await redis.srem(INGAME_KEY, ...ids);

        const counts = await redis.hmget(ONLINE_KEY, ...ids);
        userIds.forEach((userId, i) =>
        {
            const presence = inGame ? "in_game" : Number(counts[i]) > 0 ? "online" : "offline";
            emitter.to(`presence:${userId}`).emit("presence", { userId, presence });
        });
    }
    catch (err)
    {
        console.error("presence: update failed:", err);
    }
}
