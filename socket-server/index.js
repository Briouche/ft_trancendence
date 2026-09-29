import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { pubClient, subClient } from "./redis.js";
import { authenticateSocket } from "./auth.js";
import { handleConnection } from "./handlers/connection.js";
import { resetPresence } from "./presence.js";

// Chat & presence socket.io server (path /chat-socket.io/).
//
// - Connections are authenticated by the app's session cookie (auth.js, needs JWT_SECRET).
// - Every connection of a user joins the room `user:<id>`. The app pushes chat messages to those
//   rooms through the Redis emitter (app/lib/socketEmitter.ts), so this process never touches the
//   database: messages are validated and saved by the app first.
// - Presence (presence.js): SET `user_sockets:<id>` holds the user's open sockets and HASH
//   `online_users_meta` the connected users; the full list is broadcast as "presence:update" on
//   every connect/disconnect. game_engine keeps SET `presence:ingame` for users in a match.

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

io.use(authenticateSocket);

io.on("connection", (socket) => handleConnection(io, socket));

// Connection counts of a previous run are meaningless (its sockets are gone). This assumes a
// single socket-server instance, which is how the stack is deployed.
await resetPresence();

server.listen(PORT, () => {
  console.log(`[chat] socket.io server listening on port ${PORT}`);
});
