import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient } from "./redis.js";
import { authenticateSocket } from "./auth.js";
import { handleConnection } from "./handlers/connection.js";

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

io.use(authenticateSocket);

io.on("connection", (socket) => handleConnection(io, socket));

server.listen(PORT, () => {
  console.log(`[Socket.io] Dedicated server running on port ${PORT}`);
});
