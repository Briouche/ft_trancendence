import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// PrismaClient singleton, kept on globalThis outside production to survive hot reloads.
const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
    max: 10,
    // Raised past pg's 10s default so a connection survives normal gaps between requests instead
    // of being torn down and re-established (full TCP + Postgres auth handshake) on the next one.
    idleTimeoutMillis: 60000
  });
  const adapter = new PrismaPg(pool);

  // Interactive transactions default to a 5 s timeout. The first requests after a cold start
  // (connection setup, and in dev the on-demand compile of the route) were measured at 7 s, which
  // aborted pack openings and match results; 15 s leaves room on slow machines.
  return new PrismaClient({ adapter, transactionOptions: { timeout: 15_000, maxWait: 10_000 } });
};

declare global {
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
