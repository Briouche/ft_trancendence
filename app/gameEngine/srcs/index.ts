// Entry point: boots the Socket.IO game server (see socket/serverSocket.ts) that matches up
// players/AI and runs games. This is a standalone process, separate from the Next.js app.
import "dotenv/config";
import { createGameServer } from "./socket/serverSocket";

createGameServer(4000);
console.log("Game server listening on ws://localhost:4000");
