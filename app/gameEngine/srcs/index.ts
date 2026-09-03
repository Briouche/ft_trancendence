// src/index.ts
import "dotenv/config";
import { createGameServer } from "./socket/serverSocket";

createGameServer(4000);
console.log("Game server listening on ws://localhost:4000");
