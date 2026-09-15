import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { jwtVerify } from "jose";

// Chat/presence socket.io server: authenticates with the Next.js session cookie, tracks online
// users in Redis, relays chat messages.

const PORT = process.env.PORT || 4000;
const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";

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

// Path must match the nginx location proxying here (game_engine uses the default one).
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

io.use(async (socket, next) => {
  try {
    const rawCookies = socket.handshake.headers.cookie || "";

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
    await redis.sadd(userKey, socket.id);
    await redis.hset(
      "online_users_meta",
      id.toString(),
      JSON.stringify({ id, username })
    );
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
      await redis.srem(userKey, socket.id);

      // A user is offline once their last tab disconnects.
      const remainingSockets = await redis.scard(userKey);
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
