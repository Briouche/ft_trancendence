import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

// Global singleton so Next.js dev-mode hot reload (which re-evaluates this module on every
// edit) doesn't spin up a fresh Pool/PrismaClient each time and exhaust DB connections.
const prismaClientSingleton = () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

declare global {
  // Allows globalThis.prismaGlobal to be recognized by TS
  var prismaGlobal: ReturnType<typeof prismaClientSingleton> | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
