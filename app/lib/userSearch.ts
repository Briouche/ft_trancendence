import "server-only";

import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getOnlineUserIds } from "@/lib/presence";
import { publicUserSelect, toPublicUsers, type PublicUser } from "@/lib/users";
import type { UserSearchParams } from "@/lib/validation";

// Player search: filters, sort and pagination all happen in the database query, so a page costs
// the same whether there are 10 players or 100 000 (only `pageSize` rows are ever loaded).

export type PlayerRow = PublicUser & { pvpWins: number; joinedAt: string };

export type UserSearchResult = {
  users: PlayerRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function orderBy(params: UserSearchParams): Prisma.UserOrderByWithRelationInput[] {
  const dir = params.order;
  // Secondary key on id keeps the order stable between pages when the primary key ties
  // (e.g. many players at the starting Elo), so no row is skipped or shown twice.
  switch (params.sort) {
    case "pvpWins":
      return [{ winsVsPlayer: dir }, { id: "asc" }];
    case "username":
      return [{ username: dir }];
    case "joined":
      return [{ createdAt: dir }, { id: "asc" }];
    default:
      return [{ elo: dir }, { id: "asc" }];
  }
}

/** Ids of the accepted friends of a user. */
async function friendIds(userId: number): Promise<number[]> {
  const rows = await prisma.friendship.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    select: { requesterId: true, addresseeId: true },
  });
  return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
}

/** One page of players matching the search, for the viewer `viewerId`. */
export async function searchUsers(viewerId: number, params: UserSearchParams): Promise<UserSearchResult> {
  const where: Prisma.UserWhereInput = {};
  if (params.q) where.username = { contains: params.q };
  if (params.filter === "online") where.id = { in: await getOnlineUserIds() };
  if (params.filter === "friends") where.id = { in: await friendIds(viewerId) };

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: orderBy(params),
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      select: { ...publicUserSelect, winsVsPlayer: true, createdAt: true },
    }),
  ]);

  const publicUsers = await toPublicUsers(rows);
  return {
    users: publicUsers.map((u, i) => ({ ...u, pvpWins: rows[i].winsVsPlayer, joinedAt: rows[i].createdAt.toISOString() })),
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}
