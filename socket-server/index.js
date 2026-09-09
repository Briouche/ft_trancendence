import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { jwtVerify } from "jose";

const PORT = process.env.PORT || 4000;
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";

// Initialize Redis clients for pub/sub and direct database commands
const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();
const redis = new Redis(REDIS_URL);

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// Distinct from game_engine's socket.io path (default "/socket.io/") — nginx forwards the
// incoming request URI unchanged, so this must match the location block that proxies here.
const io = new Server(server, {
  path: "/chat-socket.io/",
  cors: {
    origin: (origin, callback) => callback(null, true),
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.adapter(createAdapter(pubClient, subClient));

// Authenticate via Next.js session cookie
io.use(async (socket, next) => {
  try {
    const rawCookies = socket.handshake.headers.cookie || "";

    // Natively parse the cookie string into an object
    const parsedCookies = rawCookies
      .split(";")
      .reduce((acc, cookieString) => {
        const [key, value] = cookieString.trim().split("=");
        if (key && value) acc[key] = decodeURIComponent(value);
        return acc;
      }, {});

    const token = parsedCookies.session;

    if (!token) {
      return next(new Error("Authentication error: No session token"));
    }

    if (!process.env.JWT_SECRET) {
      console.error("[Socket Auth Failed]: JWT_SECRET environment variable is missing.");
      return next(new Error("Authentication error: Server misconfiguration"));
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });

    socket.data.user = payload;
    next();
  } catch (err) {
    console.error(`[Socket Auth Failed]: ${err.name} - ${err.message}`);
    next(new Error("Authentication error: Invalid session token"));
  }
});

async function broadcastPresence() {
  try {
    const rawUsers = await redis.hgetall("online_users_meta");
    const activeUsers = Object.values(rawUsers)
      .map((u) => {
        try {
          return JSON.parse(u);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    io.emit("presence:update", activeUsers);
  } catch (err) {
    console.error("[Socket] Failed to broadcast presence:", err);
  }
}

io.on("connection", async (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);
  const { id, username } = socket.data.user;
  const userKey = `user_sockets:${id}`;

  try {
    // 1. Add this tab's socket ID atomically to the set
    await redis.sadd(userKey, socket.id);

    // 2. Store basic user metadata for global display lists
    await redis.hset(
      "online_users_meta",
      id.toString(),
      JSON.stringify({ id, username })
    );

    // 3. Broadcast updated presence list
    await broadcastPresence();
  } catch (err) {
    console.error(`[Socket] Error connecting user ${id}:`, err);
  }

  socket.on("send_message", (data) => {
    console.log(`[Socket] Message received:`, data);
    io.emit("receive_message", data);
  });

  socket.on("disconnect", async (reason) => {
    console.log(`[Socket] Client disconnected (${socket.id}): ${reason}`);

    try {
      // 1. Remove only this specific socket ID atomically
      await redis.srem(userKey, socket.id);

      // 2. Check remaining tabs for this user
      const remainingSockets = await redis.scard(userKey);

      // 3. If zero active tabs remain, remove from metadata hash
      if (remainingSockets === 0) {
        await redis.hdel("online_users_meta", id.toString());
      }

      await broadcastPresence();
    } catch (err) {
      console.error(`[Socket] Error disconnecting socket ${socket.id}:`, err);
    }
  });
});

server.listen(PORT, () => {
  console.log(`[Socket.io] Dedicated server running on port ${PORT}`);
});
