import { registerUserSocket, unregisterUserSocket, broadcastPresence } from "../presence.js";

export function handleConnection(io, socket) {
  console.log(`[Socket] Client connected: ${socket.id}`);
  const { userId, username } = socket.data.user;

  connectAndBroadcast(io, socket, userId, username);

  socket.on("send_message", (data) => {
    console.log(`[Socket] Message received:`, data);
    io.emit("receive_message", data);
  });

  socket.on("disconnect", (reason) => {
    console.log(`[Socket] Client disconnected (${socket.id}): ${reason}`);
    disconnectAndBroadcast(io, socket, userId);
  });
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
