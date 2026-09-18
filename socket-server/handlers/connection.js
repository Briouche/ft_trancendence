import { registerUserSocket, unregisterUserSocket, broadcastPresence } from "../presence.js";

export function handleConnection(io, socket) {
  console.log(`[Socket] Client connected: ${socket.id}`);
  const { userId, username } = socket.data.user;

  connectAndBroadcast(io, socket, userId, username);

  // Lets chat messages be addressed by user id (`io.to(userRoom(id))`) instead of every socket
  // id that user happens to have open (multiple tabs/devices) — the redis adapter propagates
  // room membership and emits across socket-server replicas, so this works clustered too.
  //
  // There is deliberately no client -> server "chat:message" handler: the Next.js app emits
  // "chat:message" into these rooms itself (via @socket.io/redis-emitter, see
  // app/lib/socketEmitter.ts) only after validating and persisting the message. Relaying
  // client-sent events here would let any logged-in user push arbitrary, unchecked messages.
  socket.join(userRoom(userId));

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Client disconnected (${socket.id}): ${reason}`);
    disconnectAndBroadcast(io, socket, userId);
  });
}

// Must match userRoom() in app/lib/socketEmitter.ts.
function userRoom(userId) {
  return `user:${userId}`;
}

async function connectAndBroadcast(io, socket, userId, username) {
  try {
    await registerUserSocket(userId, username, socket.id);
    await broadcastPresence(io);
  } catch (err) {
    console.error(`[Socket] Error connecting user ${userId}:`, err);
  }
}

async function disconnectAndBroadcast(io, socket, userId) {
  try {
    await unregisterUserSocket(userId, socket.id);
    await broadcastPresence(io);
  } catch (err) {
    console.error(`[Socket] Error disconnecting socket ${socket.id}:`, err);
  }
}
