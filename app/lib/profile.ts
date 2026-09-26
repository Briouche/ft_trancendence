import "server-only";

import prisma from "@/lib/prisma";
import { getBadges } from "@/lib/achievements";
import { relationship } from "@/lib/friends";
import { publicUserSelect, toPublicUsers } from "@/lib/users";

// Data of a player's public profile page (/users/[username]).

const MATCH_HISTORY_LENGTH = 10;

const MODE_LABEL = {
  PVP: "vs player",
  AI_EASY: "vs AI (Easy)",
  AI_MEDIUM: "vs AI (Medium)",
  AI_HARD: "vs AI (Hard)",
} as const;

/** Everything shown on a profile, or null when no user has this username. */
export async function getPublicProfile(username: string, viewerId: number) {
  const row = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: {
      ...publicUserSelect,
      createdAt: true,
      winsVsAiEasy: true,
      winsVsAiMedium: true,
      winsVsAiHard: true,
      winsVsPlayer: true,
    },
  });
  if (!row) return null;

  const [[user], badges, rel, matches, played] = await Promise.all([
    toPublicUsers([row]),
    getBadges(row.id),
    relationship(viewerId, row.id),
    prisma.matchPlayer.findMany({
      where: { userId: row.id },
      orderBy: { matchId: "desc" },
      take: MATCH_HISTORY_LENGTH,
      include: { match: { include: { players: { include: { user: { select: { username: true } } } } } } },
    }),
    prisma.matchPlayer.count({ where: { userId: row.id } }),
  ]);

  const wins = row.winsVsAiEasy + row.winsVsAiMedium + row.winsVsAiHard + row.winsVsPlayer;

  return {
    user,
    joinedAt: row.createdAt.toISOString(),
    stats: {
      played,
      wins,
      pvpWins: row.winsVsPlayer,
      aiWins: { easy: row.winsVsAiEasy, medium: row.winsVsAiMedium, hard: row.winsVsAiHard },
    },
    badges,
    relationship: rel,
    matches: matches.map((mp) => ({
      id: mp.matchId,
      date: mp.match.createdAt.toISOString(),
      mode: MODE_LABEL[mp.match.mode],
      won: mp.won,
      eloChange: mp.eloChange,
      endReason: mp.match.endReason,
      opponent: mp.match.players.find((p) => p.userId !== row.id)?.user.username ?? null,
    })),
  };
}

export type PublicProfile = NonNullable<Awaited<ReturnType<typeof getPublicProfile>>>;
