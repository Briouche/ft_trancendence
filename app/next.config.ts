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
  /* config options here */
  /* Stops Turbopack from breaking Prisma client generation */
  serverExternalPackages: ["@prisma/client"],
  /* Hides the "Next.js DevTools" badge that otherwise shows in a corner during dev */
  devIndicators: false,
  /* The app is reached through the nginx dev proxy (localhost:8080), not directly on the
     Next.js dev server's own port, so these origins must be allowlisted for the dev HMR
     websocket to be treated as same-origin. */
  allowedDevOrigins: ["localhost:8080", "nginx_proxy", "nextjs_app"],
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
