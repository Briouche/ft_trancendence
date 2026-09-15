// Entry point: boots the Socket.IO game server (see socket/serverSocket.ts) that matches up
// players/AI and runs games. This is a standalone process, separate from the Next.js app.
import "dotenv/config";
import { createGameServer } from "./socket/serverSocket";

// Last-resort safety net: individual DB calls are already try/caught inside serverSocket.ts,
// but this covers anything that slips through so one bad request can't take down every live
// game on the process (Node's default for an unhandled rejection is to crash).
process.on("unhandledRejection", (reason) =>
{
    console.error("Unhandled rejection (process kept alive):", reason);
});

process.on("uncaughtException", (err) =>
{
    console.error("Uncaught exception (process kept alive):", err);
});

createGameServer(4000);
console.log("Game server listening on ws://localhost:4000");
