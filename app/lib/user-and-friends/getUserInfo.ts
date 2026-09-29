import "server-only";

import { cache } from "react";
import type { UserStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/cookieSession";
import type { WinsBreakdown } from "@/components/account-menu/TrophyPanel";

// Shape shown on any profile page — own or someone else's. CurrentUser adds `email`, which is
// only ever fetched/shown for the session owner's own /profile (see getUserProfileById below).
export type ProfileUser = {
  id: number;
  username: string;
  avatar: string | null;
  status: UserStatus;
  createdAt: Date;
  wins: WinsBreakdown;
  friendCount: number;
};

// `hasPassword` is false for OAuth-only accounts — the edit form only asks for the current
// password (see updateUserProfile) when there is one to ask for. The hash itself never leaves here.
export type CurrentUser = ProfileUser & { email: string; hasPassword: boolean };

const WIN_COLUMNS = {
  winsVsAiEasy: true,
  winsVsAiMedium: true,
  winsVsAiHard: true,
  winsVsPlayer: true,
} as const;

function toWins(user: {
  winsVsAiEasy: number;
  winsVsAiMedium: number;
  winsVsAiHard: number;
  winsVsPlayer: number;
}): WinsBreakdown {
  return {
    vsAiEasy: user.winsVsAiEasy,
    vsAiMedium: user.winsVsAiMedium,
    vsAiHard: user.winsVsAiHard,
    vsPlayer: user.winsVsPlayer,
  };
}

export const getUserInfo = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      username: true,
      email: true,
      password: true,
      avatar: true,
      status: true,
      createdAt: true,
      ...WIN_COLUMNS,
    },
  });
  if (!user) return null;

  const friendCount = await countFriends(session.userId);

  return {
    id: session.userId,
    username: user.username,
    email: user.email,
    hasPassword: user.password !== null,
    avatar: user.avatar,
    status: user.status,
    createdAt: user.createdAt,
    wins: toWins(user),
    friendCount,
  };
});

// Public profile lookup for another user (friends/requests rows) — no email, since that's only
// meant to be visible on the account owner's own /profile. Still requires an active session, so
// looking up profiles stays behind login like the rest of the app.
export const getUserProfileById = cache(async (id: number): Promise<ProfileUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      avatar: true,
      status: true,
      createdAt: true,
      ...WIN_COLUMNS,
    },
  });
  if (!user) return null;

  const friendCount = await countFriends(id);

  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    status: user.status,
    createdAt: user.createdAt,
    wins: toWins(user),
    friendCount,
  };
});

// Same as getUserProfileById but keyed by username, since profile URLs use the username rather
// than the raw numeric id (see /profile/[username]) to avoid exposing/enumerating sequential ids.
export const getUserProfileByUsername = cache(async (username: string): Promise<ProfileUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      avatar: true,
      status: true,
      createdAt: true,
      ...WIN_COLUMNS,
    },
  });
  if (!user) return null;

  const friendCount = await countFriends(user.id);

  return {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    status: user.status,
    createdAt: user.createdAt,
    wins: toWins(user),
    friendCount,
  };
});

// Chat access is gated on friendship (see lib/messages.ts) — checked against the session owner,
// same as countFriends/getUserProfileById below.
export const areFriends = cache(async (otherId: number): Promise<boolean> => {
  const session = await getSession();
  if (!session) return false;

  const friendship = await prisma.friendship.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { requesterId: session.userId, addresseeId: otherId },
        { requesterId: otherId, addresseeId: session.userId },
      ],
    },
  });

  return !!friendship;
});

function countFriends(userId: number) {
  return prisma.friendship.count({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
  });
}
