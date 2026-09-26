import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// The game server's single Prisma client (same schema as the app: app/prisma/schema.prisma,
// copied in at build time by game_engine/Dockerfile).
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    max: 15,
    // Kept past pg's 10s default so a connection survives the gaps between matches instead of
    // paying a full TCP + auth handshake on the next match start.
    idleTimeoutMillis: 60000,
});

// 15 s instead of the default 5 s for interactive transactions: a match result written right
// after a cold start must not be aborted by a slow first connection.
export const prisma = new PrismaClient({
    adapter: new PrismaPg(pool),
    transactionOptions: { timeout: 15_000, maxWait: 10_000 },
});
