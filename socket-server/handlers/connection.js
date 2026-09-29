import { addUserSocket, onlineAmong, removeUserSocket } from "../presence.js";

// Upper bound of users one connection may watch (a friends list plus open profiles).
const MAX_WATCHED = 200;

/** Room every socket of a user joins. Must match userRoom() in app/lib/socketEmitter.ts. */
export function userRoom(userId) {
  return `user:${userId}`;
}

/** Room joined by the sockets currently displaying that user's presence. */
function presenceRoom(userId) {
  return `presence:${userId}`;
}

/** Valid, de-duplicated list of user ids to watch, or null. */
function parseWatchList(ids) {
  if (!Array.isArray(ids) || ids.length > MAX_WATCHED) return null;
  return ids.every((id) => Number.isSafeInteger(id) && id > 0) ? [...new Set(ids)] : null;
}

/**
 * Wires one authenticated connection:
 * - it joins `user:<id>`, where the app pushes chat messages (via the Redis emitter) only after
 *   validating and saving them — there is deliberately no client → server chat event, which
 *   would let a client push unchecked messages;
 * - presence changes are sent only to `presence:<id>`, joined by the clients that display that
 *   user ("presence:watch"), instead of broadcasting every change to everyone.
 */
export function handleConnection(io, socket) {
  const { userId } = socket.data.user;
  socket.join(userRoom(userId));

  const announce = (online) => io.to(presenceRoom(userId)).emit("presence", { userId, online });

  addUserSocket(userId, socket.id)
    .then((cameOnline) => cameOnline && announce(true))
    .catch((err) => console.error(`[presence] connect of user ${userId} failed:`, err));

  // Replaces the set of users this connection follows, and answers with who among them is online
  // right now, so the client doesn't wait for the next change.
  socket.on("presence:watch", async (ids, ack) => {
    const list = parseWatchList(ids);
    if (!list) return typeof ack === "function" && ack({ error: "invalid list" });

    for (const room of socket.rooms) {
      if (room.startsWith("presence:") && !list.includes(Number(room.slice("presence:".length)))) socket.leave(room);
    }
    socket.join(list.map(presenceRoom));

    if (typeof ack === "function") {
      try {
        ack({ online: await onlineAmong(list) });
      } catch (err) {
        console.error("[presence] watch lookup failed:", err);
        ack({ error: "unavailable" });
      }
    }
  });

  socket.on("disconnect", () => {
    removeUserSocket(userId, socket.id)
      .then((wentOffline) => wentOffline && announce(false))
      .catch((err) => console.error(`[presence] disconnect of user ${userId} failed:`, err));
  });
}
