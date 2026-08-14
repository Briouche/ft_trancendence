import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  /* Stops Turbopack from breaking Prisma client generation */
  serverExternalPackages: ["@prisma/client"],
  /* The app is reached through the nginx dev proxy (localhost:8080), not directly on the
     Next.js dev server's own port — without this, Next blocks the HMR websocket as
     cross-origin and the browser silently keeps serving the last bundle it loaded. */
  allowedDevOrigins: ["localhost:8080", "nginx_proxy", "nextjs_app"],
};

export default nextConfig;
