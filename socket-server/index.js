import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient } from "./redis.js";
import { authenticateSocket, isSameOrigin } from "./auth.js";
import { handleConnection } from "./handlers/connection.js";
import { resetPresence } from "./presence.js";

// Chat & presence socket.io server (path /chat-socket.io/, behind nginx's TLS). It authenticates
// connections with the app's session cookie, tracks who is online in Redis and delivers the
// chat messages the app publishes through the Redis adapter. It never touches the database.

const PORT = Number(process.env.PORT || 4000);

// Plain HTTP server, with a health route for Docker.
const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }
  res.writeHead(404);
  res.end();
});

// The path must match the nginx location proxying here (game_engine uses the default one).
// No CORS: pages and sockets are served from the same origin, and allowRequest rejects handshakes
// coming from any other site.
const io = new Server(server, {
  path: "/chat-socket.io/",
  allowRequest: (req, callback) => callback(null, isSameOrigin(req)),
  pingTimeout: 60000,
  pingInterval: 25000,
});

io.adapter(createAdapter(pubClient, subClient));
io.use(authenticateSocket);
io.on("connection", (socket) => handleConnection(io, socket));

await resetPresence();

server.listen(PORT, () => {
  console.log(`[chat] socket.io server listening on port ${PORT}`);
});
