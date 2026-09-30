// Shared by the client components (form limits, early feedback) and the server actions
// (actual enforcement) — "use server" files may only export async functions, so these live here.

// Stored as a data URI directly on User.avatar (text column) — small enough not to bother with
// a separate file store/volume, and it round-trips through the existing db_data volume for free.
// Kept well under Next.js's 1MB default server-action body limit (the file is sent in FormData).
export const AVATAR_MAX_BYTES = 512 * 1024; // 512KB
export const AVATAR_MAX_LABEL = "512KB";
export const AVATAR_ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export const MESSAGE_MAX_LENGTH = 2000;

// The fields a friends/requests/search row needs (components/friends/Row.tsx). Deliberately no
// `avatar`: it's a data URI of up to ~700KB per user, and rows don't display it.
export const FRIEND_ROW_SELECT = { id: true, username: true, status: true } as const;

// Server action arguments come straight from the client and are only typed at compile time —
// ids must be re-checked at runtime before they reach Prisma.
// Capped at the PostgreSQL `integer` maximum, like idSchema in lib/validation.ts.
export function isValidId(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 && value <= 2_147_483_647;
}
