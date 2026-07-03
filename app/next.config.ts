import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  /* Stops Turbopack from breaking Prisma client generation */
  serverExternalPackages: ["@prisma/client"],
};

export default nextConfig;
