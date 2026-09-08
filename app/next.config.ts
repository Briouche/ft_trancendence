import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  /* Stops Turbopack from breaking Prisma client generation */
  serverExternalPackages: ["@prisma/client"],
  /* Hides the "Next.js DevTools" badge that otherwise shows in a corner during dev */
  devIndicators: false,
  /* The app is reached through the nginx dev proxy (localhost:8080), not directly on the
     Next.js dev server's own port, so these origins must be allowlisted for the dev HMR
     websocket to be treated as same-origin. */
  allowedDevOrigins: ["localhost:8080", "nginx_proxy", "nextjs_app"],
};

export default nextConfig;
