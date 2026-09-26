// Presence values, importable from client components (lib/presence.ts is server-only).

export type Presence = "online" | "in_game" | "offline";

export const PRESENCE_LABEL: Record<Presence, string> = {
  online: "Online",
  in_game: "In a match",
  offline: "Offline",
};
