// Standalone Socket.IO game server, separate from the Next.js app.
import "dotenv/config";
import { createGameServer } from "./socket/serverSocket";

createGameServer(4000);
console.log("Game server listening on ws://localhost:4000");
