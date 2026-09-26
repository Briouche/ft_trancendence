import "server-only";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { pushToUsers } from "@/lib/realtime";
import { CHAT_EVENTS } from "@/lib/chatEvents";
import { publicUserSelect, toPublicUsers, type PublicUser } from "@/lib/users";

// Friend system: requests, answers, removal. One Friendship row per pair of users, whichever of
// the two asked first (requesterId → addresseeId); status PENDING until the addressee accepts.
// Every change notifies both users in real time (friends:changed) so their lists refresh.

export type FriendRequest = { friendshipId: number; user: PublicUser; createdAt: Date };

/** The friendship row between two users, in either direction, if any. */
function pairWhere(a: number, b: number): Prisma.FriendshipWhereInput {
  return {
    OR: [
      { requesterId: a, addresseeId: b },
      { requesterId: b, addresseeId: a },
    ],
  };
}

/** Accepted friends of a user, with their presence. */
export async function listFriends(userId: number): Promise<PublicUser[]> {
  const rows = await prisma.friendship.findMany({
    where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { addresseeId: userId }] },
    include: { requester: { select: publicUserSelect }, addressee: { select: publicUserSelect } },
  });
  const friends = rows.map((f) => (f.requesterId === userId ? f.addressee : f.requester));
  friends.sort((a, b) => a.username.localeCompare(b.username));
  return toPublicUsers(friends);
}

/** Pending requests received (`incoming`) or sent (`outgoing`) by a user, newest first. */
export async function listRequests(userId: number, direction: "incoming" | "outgoing"): Promise<FriendRequest[]> {
  const rows = await prisma.friendship.findMany({
    where: { status: "PENDING", ...(direction === "incoming" ? { addresseeId: userId } : { requesterId: userId }) },
    include: { requester: { select: publicUserSelect }, addressee: { select: publicUserSelect } },
    orderBy: { createdAt: "desc" },
  });
  const users = await toPublicUsers(rows.map((r) => (direction === "incoming" ? r.requester : r.addressee)));
  return rows.map((r, i) => ({ friendshipId: r.id, user: users[i], createdAt: r.createdAt }));
}

/** True when the two users are accepted friends. */
export async function areFriends(a: number, b: number): Promise<boolean> {
  const row = await prisma.friendship.findFirst({ where: { status: "ACCEPTED", ...pairWhere(a, b) }, select: { id: true } });
  return row !== null;
}

/** Relationship of `viewerId` to `otherId`, as shown on a profile page. */
export async function relationship(viewerId: number, otherId: number) {
  if (viewerId === otherId) return { kind: "self" as const };
  const row = await prisma.friendship.findFirst({ where: pairWhere(viewerId, otherId) });
  if (!row) return { kind: "none" as const };
  if (row.status === "ACCEPTED") return { kind: "friends" as const, friendshipId: row.id };
  return row.requesterId === viewerId
    ? { kind: "outgoing" as const, friendshipId: row.id }
    : { kind: "incoming" as const, friendshipId: row.id };
}

export type SendRequestResult =
  | "sent"
  | "accepted"
  | "self"
  | "not_found"
  | "already_friends"
  | "already_sent";

/**
 * Sends a friend request to `username`. If that user had already sent one to us, it is accepted
 * instead (both people clearly want it).
 *
 * Runs as a SERIALIZABLE transaction: two users sending each other a request at the same instant
 * would otherwise both see "no row yet" and create two rows for the same pair (the unique
 * constraint only covers one direction). Postgres aborts one of them (P2034), which is retried.
 */
export async function sendFriendRequest(userId: number, username: string): Promise<SendRequestResult> {
  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target) return "not_found";
  if (target.id === userId) return "self";

  for (let attempt = 0; ; attempt++) {
    try {
      const result = await prisma.$transaction(
        async (tx): Promise<SendRequestResult> => {
          const existing = await tx.friendship.findFirst({ where: pairWhere(userId, target.id) });
          if (existing?.status === "ACCEPTED") return "already_friends";
          if (existing && existing.requesterId === userId) return "already_sent";
          if (existing) {
            await tx.friendship.update({ where: { id: existing.id }, data: { status: "ACCEPTED" } });
            return "accepted";
          }
          await tx.friendship.create({ data: { requesterId: userId, addresseeId: target.id } });
          return "sent";
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      if (result === "sent" || result === "accepted") {
        pushToUsers([userId, target.id], CHAT_EVENTS.friendsChanged, null);
      }
      return result;
    } catch (err) {
      const isConflict =
        err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2034" || err.code === "P2002");
      if (!isConflict || attempt >= 2) throw err;
    }
  }
}

/**
 * Accepts or declines a pending request. Only its addressee may answer it.
 * @returns false when there is no such pending request addressed to `userId`.
 */
export async function answerFriendRequest(userId: number, friendshipId: number, accept: boolean): Promise<boolean> {
  // Conditional write (addressee + PENDING in the WHERE): a double click, or the requester
  // cancelling at the same moment, can't make this apply twice or to the wrong row.
  const where = { id: friendshipId, addresseeId: userId, status: "PENDING" as const };
  const row = await prisma.friendship.findFirst({ where, select: { requesterId: true } });
  if (!row) return false;

  const { count } = accept
    ? await prisma.friendship.updateMany({ where, data: { status: "ACCEPTED" } })
    : await prisma.friendship.deleteMany({ where });
  if (count === 0) return false;

  pushToUsers([userId, row.requesterId], CHAT_EVENTS.friendsChanged, null);
  return true;
}

/** Cancels a request `userId` sent and that is still pending. */
export async function cancelFriendRequest(userId: number, friendshipId: number): Promise<boolean> {
  const row = await prisma.friendship.findFirst({
    where: { id: friendshipId, requesterId: userId, status: "PENDING" },
    select: { addresseeId: true },
  });
  if (!row) return false;

  const { count } = await prisma.friendship.deleteMany({
    where: { id: friendshipId, requesterId: userId, status: "PENDING" },
  });
  if (count > 0) pushToUsers([userId, row.addresseeId], CHAT_EVENTS.friendsChanged, null);
  return count > 0;
}

/** Ends an accepted friendship. */
export async function removeFriend(userId: number, friendId: number): Promise<boolean> {
  const { count } = await prisma.friendship.deleteMany({
    where: { status: "ACCEPTED", ...pairWhere(userId, friendId) },
  });
  if (count > 0) pushToUsers([userId, friendId], CHAT_EVENTS.friendsChanged, null);
  return count > 0;
}
