// Test tools (free pack, unlock all, clear collection) exist only for local testing: in production
// they would let any player hand themselves the whole collection. NODE_ENV is inlined at build
// time, so this also works in client components.
export const DEV_TOOLS_ENABLED = process.env.NODE_ENV !== "production";
