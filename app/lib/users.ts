import "server-only";

import { avatarUrl } from "@/lib/avatar";
import { getPresence, type Presence } from "@/lib/presence";

// The "public" view of a user: what any signed-in player may see about another one. Never
// includes the email, password hash, OAuth id or token version.

export type PublicUser = {
  id: number;
  username: string;
  avatarUrl: string;
  elo: number;
  presence: Presence;
};

/** Prisma `select` for the columns a PublicUser is built from. */
export const publicUserSelect = { id: true, username: true, avatar: true, elo: true } as const;

type PublicUserRow = { id: number; username: string; avatar: string | null; elo: number };

/** Adds presence (one Redis round trip for the whole list) and the avatar URL. */
export async function toPublicUsers(rows: PublicUserRow[]): Promise<PublicUser[]> {
  const presence = await getPresence(rows.map((r) => r.id));
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    avatarUrl: avatarUrl(r.avatar),
    elo: r.elo,
    presence: presence.get(r.id) ?? "offline",
  }));
}
