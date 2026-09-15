// Entry point: boots the Socket.IO game server (see socket/serverSocket.ts) that matches up
// players/AI and runs games. This is a standalone process, separate from the Next.js app.
import "dotenv/config";
import { createGameServer } from "./socket/serverSocket";
import { ensureCatalogLoaded } from "./cardImport/cardLoader";

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

// Pull the card catalog into memory now rather than on the first match start, so the first player
// of the process doesn't pay for it (it also warms up Prisma/the pg pool). Not awaited: the server
// is already accepting connections, and ensureCatalogLoaded() is memoized, so a match starting
// before this settles just waits on the same promise. A failure here is non-fatal — the memo is
// cleared, and the next match start retries.
ensureCatalogLoaded().catch(err => console.error("Card catalog preload failed (will retry on demand):", err));
