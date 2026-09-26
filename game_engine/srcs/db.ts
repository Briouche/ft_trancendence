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

export const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
