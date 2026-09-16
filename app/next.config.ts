import type { NextConfig } from "next";
import path from "path";

// Redirects every `import ... from "phaser"` to game/phaserVendor/phaserEntry.ts, a trimmed copy
// of Phaser's own entry point with the (unused here) Arcade Physics engine stripped out — see that
// file's header for what's excluded and why. Set for both bundlers since this project runs
// Turbopack in dev (see the Prisma comment below) but may still build with webpack.
//
// Turbopack's resolveAlias wants a project-relative path string (its resolver doesn't accept an
// OS-absolute path the way webpack's resolve.alias does — that fails with "server relative
// imports are not implemented yet"), so the two aliases below intentionally use different forms.
const phaserAliasRelative = "./game/phaserVendor/phaserEntry.ts";
const phaserAliasAbsolute = path.resolve(__dirname, "game/phaserVendor/phaserEntry.ts");

// Phaser's WebGLRenderer does `require('phaser3spectorjs')` behind a `typeof WEBGL_DEBUG` guard
// that's never true here, but that package is only a devDependency of `phaser` itself (not
// installed in this app), so the bundler's static resolver fails on it regardless of the guard —
// see phaserVendor/phaser3spectorjsStub.ts for the full explanation.
const spectorStubRelative = "./game/phaserVendor/phaser3spectorjsStub.ts";
const spectorStubAbsolute = path.resolve(__dirname, "game/phaserVendor/phaser3spectorjsStub.ts");

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client"],
  devIndicators: false,
  experimental: {
    /* Defaults to true. On slow/low-core hardware this cache's periodic background writes
       ("Finished writing to filesystem cache" / "filesystem cache database compaction" in the
       dev server log) can block the whole process for 30+ seconds at unpredictable times —
       including mid-session, not just at startup — which was observed freezing an in-progress
       match and dropping its Postgres connection. Dev-only: has no effect on `next build`. */
    turbopackFileSystemCacheForDev: false,
  },
  /* The app is reached through the nginx dev proxy (localhost:8080), not directly on the
     Next.js dev server's own port, so these origins must be allowlisted for the dev HMR
     websocket to be treated as same-origin. "10.19.1.*" is a per-segment wildcard (Next matches
     Origin/Referer hostnames the same way it would a DNS name, e.g. "*.example.com" — an IPv4
     address happens to also be dot-separated, so the last octet can vary freely) covering any
     device on the current home LAN, so a friend can join a LAN match without editing this file
     for every different last-octet IP. Only covers this specific /24 — switching to a different
     network (different first three octets) still needs a new entry here.
     https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins */
  allowedDevOrigins: ["localhost:8080", "nginx_proxy", "nextjs_app", "10.10.245.*"],
  turbopack: {
    resolveAlias: {
      phaser: phaserAliasRelative,
      phaser3spectorjs: spectorStubRelative,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      phaser: phaserAliasAbsolute,
      phaser3spectorjs: spectorStubAbsolute,
    };
    return config;
  },
};

export default nextConfig;
