import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client"],
  devIndicators: false,
  // Origins the dev server is reached through (nginx proxy), for HMR.
  allowedDevOrigins: ["localhost:8080", "nginx_proxy", "nextjs_app"],
};

export default nextConfig;
