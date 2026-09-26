import { defineConfig } from "vitest/config";

// Unit tests of the game rules, the AI and the result computations (no database, no sockets).
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 20_000,
  },
});
