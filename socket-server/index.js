import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient } from "./redis.js";
import { authenticateSocket } from "./auth.js";
import { handleConnection } from "./handlers/connection.js";
import { resetPresence } from "./presence.js";

// Chat/presence socket.io server: authenticates with the Next.js session cookie, tracks online
// users in Redis, relays chat messages.

const PORT = process.env.PORT || 4000;

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

io.use(authenticateSocket);

io.on("connection", (socket) => handleConnection(io, socket));

// Clear presence left over from a previous run before any client can register again.
try {
  await resetPresence();
} catch (err) {
  console.error("[Socket] Failed to reset stale presence:", err);
}

server.listen(PORT, () => {
  console.log(`[Socket.io] Dedicated server running on port ${PORT}`);
});
