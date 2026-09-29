import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
<<<<<<< HEAD
import { Redis } from "ioredis";
=======
import { pubClient, subClient } from "./redis.js";
import { authenticateSocket } from "./auth.js";
import { handleConnection } from "./handlers/connection.js";
>>>>>>> origin/merge/readme-review-dev

// Chat & presence socket.io server (path /chat-socket.io/).
//
// - Every connection of a user joins the room `user:<id>`. The app pushes chat messages and
//   friend-list changes to those rooms through the Redis adapter (app/lib/realtime.ts), so this
//   process never touches the database: messages are validated and saved by the app first.
// - Presence: HASH `presence:online` counts open connections per user; a user is online while
//   the count is > 0 (several tabs = several connections). game_engine keeps SET
//   `presence:ingame`. A presence change is sent to the room `presence:<id>`, joined only by the
//   clients currently displaying that user (see "presence:watch"), not broadcast to everyone.

<<<<<<< HEAD
const PORT = Number(process.env.PORT || 4000);
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
const APP_INTERNAL_URL = process.env.APP_INTERNAL_URL || "http://app:3000";

// Keep in sync with app/lib/presence.ts and game_engine/srcs/presence.ts.
const ONLINE_KEY = "presence:online";
const INGAME_KEY = "presence:ingame";

// Upper bound of users one connection may watch (a friends list or one page of players).
const MAX_WATCHED = 200;
// The app compiles routes on first hit in dev (several seconds on slow machines).
const AUTH_TIMEOUT_MS = 15_000;

const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();
const redis = pubClient.duplicate();
=======
const PORT = process.env.PORT || 4000;
>>>>>>> origin/merge/readme-review-dev

// creates the server with a health rule for docker-compose
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

/**
 * Accepts only same-origin browser connections (Origin host = Host header forwarded by nginx).
 * WebSocket upgrades bypass CORS, so without this any website could open a socket authenticated
 * by the visitor's session cookie. Requests without Origin (non-browser) still need the cookie.
 */
function isSameOrigin(req, callback) {
  const origin = req.headers.origin;
  if (!origin) return callback(null, true);
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    return callback("invalid origin", false);
  }
  const ok = host === req.headers.host;
  callback(ok ? null : "cross-origin request refused", ok);
}

// Path must match the nginx location proxying here (game_engine uses the default /socket.io/).
const io = new Server(server, {
  path: "/chat-socket.io/",
  allowRequest: isSameOrigin,
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.adapter(createAdapter(pubClient, subClient));

<<<<<<< HEAD
/**
 * Identity behind the handshake's session cookie, asked to the app (GET /api/auth/me) so this
 * socket applies exactly the app's checks, including revoked sessions (tokenVersion).
 * @returns {Promise<{ id: number, username: string } | null>}
 */
async function authenticate(cookieHeader) {
  if (!cookieHeader) return null;
  const res = await fetch(`${APP_INTERNAL_URL}/api/auth/me`, {
    headers: { cookie: cookieHeader },
    signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const body = await res.json();
  return Number.isInteger(body?.id) ? { id: body.id, username: String(body.username) } : null;
}

io.use(async (socket, next) => {
  try {
    const user = await authenticate(socket.handshake.headers.cookie);
    if (!user) return next(new Error("unauthenticated"));
    socket.data.user = user;
    next();
  } catch (err) {
    console.error("[chat] auth failed:", err instanceof Error ? err.message : err);
    next(new Error("unauthenticated"));
  }
});

/** Current presence of one user: "in_game" > "online" > "offline". */
async function presenceOf(userId) {
  const [inGame, count] = await Promise.all([redis.sismember(INGAME_KEY, String(userId)), redis.hget(ONLINE_KEY, String(userId))]);
  if (inGame === 1) return "in_game";
  return Number(count) > 0 ? "online" : "offline";
}

/** Sends a user's presence to everyone watching them. */
async function announce(userId) {
  io.to(`presence:${userId}`).emit("presence", { userId, presence: await presenceOf(userId) });
}

/** Valid list of user ids to watch, or null. */
function parseWatchList(ids) {
  if (!Array.isArray(ids) || ids.length > MAX_WATCHED) return null;
  return ids.every((id) => Number.isSafeInteger(id) && id > 0) ? [...new Set(ids)] : null;
}

io.on("connection", async (socket) => {
  const { id } = socket.data.user;
  socket.join(`user:${id}`);

  try {
    // First connection of this user (no other tab open): they just came online.
    if ((await redis.hincrby(ONLINE_KEY, String(id), 1)) === 1) await announce(id);
  } catch (err) {
    console.error(`[chat] presence update failed for user ${id}:`, err);
  }

  // Replaces the set of users this connection receives presence updates for, and answers with
  // their current presence so the client doesn't have to wait for the next change.
  socket.on("presence:watch", async (ids, ack) => {
    const list = parseWatchList(ids);
    if (!list) return typeof ack === "function" && ack({ error: "invalid list" });

    for (const room of socket.rooms) {
      if (room.startsWith("presence:") && !list.includes(Number(room.slice(9)))) socket.leave(room);
    }
    socket.join(list.map((u) => `presence:${u}`));

    if (typeof ack === "function") {
      const entries = await Promise.all(list.map(async (u) => [u, await presenceOf(u)]));
      ack({ presence: Object.fromEntries(entries) });
    }
  });

  socket.on("presence:unwatch", () => {
    for (const room of socket.rooms) if (room.startsWith("presence:")) socket.leave(room);
  });

  socket.on("disconnect", async () => {
    try {
      // Last connection of this user closed: they went offline.
      if ((await redis.hincrby(ONLINE_KEY, String(id), -1)) <= 0) {
        await redis.hdel(ONLINE_KEY, String(id));
        await announce(id);
      }
    } catch (err) {
      console.error(`[chat] presence update failed for user ${id}:`, err);
    }
  });
});
=======
io.use(authenticateSocket);

io.on("connection", (socket) => handleConnection(io, socket));
>>>>>>> origin/merge/readme-review-dev

// Connection counts of a previous run are meaningless (its sockets are gone). This assumes a
// single socket-server instance, which is how the stack is deployed.
await redis.del(ONLINE_KEY);

server.listen(PORT, () => {
  console.log(`[chat] socket.io server listening on port ${PORT}`);
});
