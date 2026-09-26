// Standalone Socket.IO game server, separate from the Next.js app.
import "dotenv/config";
import { createGameServer } from "./socket/serverSocket";
import { ensureCatalogLoaded } from "./cardImport/cardLoader";
import { resetInGamePresence } from "./presence";

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

// Matches live in this process's memory, so none survive a restart: clear their "in a match"
// presence before accepting players again.
void resetInGamePresence();
createGameServer(4000);
console.log("Game server listening on ws://localhost:4000");

// Pull the card catalog into memory now rather than on the first match start, so the first player
// of the process doesn't pay for it (it also warms up Prisma/the pg pool). Not awaited: the server
// is already accepting connections, and ensureCatalogLoaded() is memoized, so a match starting
// before this settles just waits on the same promise.
//
// This retries because it routinely loses a race at boot: game_engine only waits for the DB to be
// healthy, while the migrations and the card seed run in the *app* container, so the first few
// attempts here can hit a missing table or an unseeded one. A match start would recover on its own
// (the memo clears on failure), but then the very first player pays the full load — which is the
// cost this preload exists to avoid, and it is worst on exactly the slow machines it matters on.
function preloadCatalog(attempt = 1): void
{
    ensureCatalogLoaded().catch(err =>
    {
        if (attempt >= 15)
        {
            console.error("Card catalog preload gave up (will retry on the next match start):", err);
            return;
        }
        console.warn(`Card catalog preload attempt ${attempt} failed, retrying in 2s:`, err instanceof Error ? err.message : err);
        setTimeout(() => preloadCatalog(attempt + 1), 2000);
    });
}

preloadCatalog();
