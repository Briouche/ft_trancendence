import { defineConfig } from "vitest/config";
import path from "path";

// Unit tests of the app's server logic (lib/). `server-only` throws outside Next's server bundle,
// so it is replaced by an empty module here.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname),
      "server-only": path.resolve(import.meta.dirname, "tests/serverOnlyStub.ts"),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
