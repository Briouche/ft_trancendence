// Test tools (free pack, clear / unlock the whole collection) exist to try the game quickly during
// development. They must never be reachable in production, where they would let any player grant
// themselves unlimited packs or every card.
export const DEV_TOOLS_ENABLED = process.env.NODE_ENV !== "production";
