"use server";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getUserInfo } from "@/lib/user-and-friends/getUserInfo";
import { FRIEND_ROW_SELECT, isValidId } from "@/lib/user-and-friends/requirements";
import { USERNAME_MAX_LENGTH, USERNAME_REGEX } from "@/lib/auth/requirements";
import { rateLimit } from "@/lib/rateLimit";

// Stops one account from spamming every player with requests.
const FRIEND_REQUESTS_PER_USER = { max: 30, windowMs: 60 * 60 * 1000 };

// Every export here is a server action, i.e. a public endpoint: arguments are only typed at
// compile time, so each one re-checks its inputs at runtime before touching the database.

export async function searchUserByUsername(usernameRaw: string) {
  const currentUser = await getUserInfo();
  if (!currentUser) return null;

  if (typeof usernameRaw !== "string") return null;
  const username = usernameRaw.trim().toLocaleLowerCase();
  // Anything that couldn't be a valid username can't match one — skip the query.
  if (!username || username.length > USERNAME_MAX_LENGTH || !USERNAME_REGEX.test(username)) return null;

  const user = await prisma.user.findUnique({
    where: { username },
    select: FRIEND_ROW_SELECT,
  });

  if (!user || user.id === currentUser.id) return null;

  return user;
}

export async function sendFriendRequest(addresseeId: number) {
  const currentUser = await getUserInfo();
  if (!currentUser) return { error: "Unauthorized. Please log in again." };

  if (!isValidId(addresseeId)) return { error: "User not found." };
  if (addresseeId === currentUser.id) {
    return { error: "You can't send a friend request to yourself." };
  }

  const addressee = await prisma.user.findUnique({ where: { id: addresseeId }, select: { id: true } });
  if (!addressee) return { error: "User not found." };

  if (!rateLimit(`friend-request:user:${currentUser.id}`, FRIEND_REQUESTS_PER_USER)) {
    return { error: "Too many friend requests. Please try again later." };
  }

  // @@unique([requesterId, addresseeId]) only covers one direction, so without this lock A->B and
  // B->A sent at the same moment would both pass the check below and create two rows (which,
  // once both accepted, makes each a friend of the other twice). The transaction-scoped advisory
  // lock is keyed on the unordered pair, so concurrent requests between the same two users run
  // one at a time and the second one sees the first one's row.
  const [lowId, highId] = currentUser.id < addresseeId ? [currentUser.id, addresseeId] : [addresseeId, currentUser.id];

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lowId}::int, ${highId}::int)`;

      const existing = await tx.friendship.findFirst({
        where: {
          OR: [
            { requesterId: currentUser.id, addresseeId },
            { requesterId: addresseeId, addresseeId: currentUser.id },
          ],
        },
      });

      if (existing) {
        if (existing.status === "ACCEPTED") {
          return { error: "You are already friends." };
        }
        if (existing.requesterId === currentUser.id) {
          return { error: "Friend request already sent." };
        }
        return { error: "This user already sent you a request — check your received requests." };
      }

      await tx.friendship.create({
        data: { requesterId: currentUser.id, addresseeId, status: "PENDING" },
      });

      return { error: null };
    });
  } catch (err) {
    // Belt and braces: the lock already prevents this, but a duplicate is still a known outcome.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "Friend request already sent." };
    }
    throw err;
  }
}

// The actions below each do their ownership/status check and their write in one conditional
// statement (updateMany/deleteMany + count) instead of read-then-write, so a row that changes in
// between (e.g. the requester cancels while the addressee accepts) is just "not found" rather
// than an unhandled "record not found" error.

// accept: PENDING -> ACCEPTED. refuse: the row is just deleted (no REJECTED status) so either
// side is free to send a new request later.
export async function respondToFriendRequest(friendshipId: number, accept: boolean) {
  const currentUser = await getUserInfo();
  if (!currentUser) return { error: "Unauthorized. Please log in again." };

  if (!isValidId(friendshipId) || typeof accept !== "boolean") return { error: "Request not found." };

  const where = { id: friendshipId, addresseeId: currentUser.id, status: "PENDING" as const };
  const { count } = accept
    ? await prisma.friendship.updateMany({ where, data: { status: "ACCEPTED" } })
    : await prisma.friendship.deleteMany({ where });

  if (count === 0) return { error: "Request not found." };
  return { error: null };
}

// Lets the requester withdraw a request they sent before it's been answered.
export async function cancelFriendRequest(friendshipId: number) {
  const currentUser = await getUserInfo();
  if (!currentUser) return { error: "Unauthorized. Please log in again." };

  if (!isValidId(friendshipId)) return { error: "Request not found." };

  const { count } = await prisma.friendship.deleteMany({
    where: { id: friendshipId, requesterId: currentUser.id, status: "PENDING" },
  });

  if (count === 0) return { error: "Request not found." };
  return { error: null };
}

// Ends an existing (ACCEPTED) friendship. Either side can do this.
export async function removeFriend(friendshipId: number) {
  const currentUser = await getUserInfo();
  if (!currentUser) return { error: "Unauthorized. Please log in again." };

  if (!isValidId(friendshipId)) return { error: "Friendship not found." };

  const { count } = await prisma.friendship.deleteMany({
    where: {
      id: friendshipId,
      status: "ACCEPTED",
      OR: [{ requesterId: currentUser.id }, { addresseeId: currentUser.id }],
    },
  });

  if (count === 0) return { error: "Friendship not found." };
  return { error: null };
}
