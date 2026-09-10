"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function searchUserByUsername(usernameRaw: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const username = usernameRaw.trim().toLocaleLowerCase();
  if (!username) return null;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, avatar: true, status: true },
  });

  if (!user || user.id === currentUser.id) return null;

  return user;
}

export async function sendFriendRequest(addresseeId: number) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Unauthorized. Please log in again." };

  if (addresseeId === currentUser.id) {
    return { error: "You can't send a friend request to yourself." };
  }

  const existing = await prisma.friendship.findFirst({
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

  await prisma.friendship.create({
    data: { requesterId: currentUser.id, addresseeId, status: "PENDING" },
  });

  return { error: null };
}

// accept: PENDING -> ACCEPTED. refuse: the row is just deleted (no REJECTED status) so either
// side is free to send a new request later.
export async function respondToFriendRequest(friendshipId: number, accept: boolean) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Unauthorized. Please log in again." };

  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship || friendship.addresseeId !== currentUser.id || friendship.status !== "PENDING") {
    return { error: "Request not found." };
  }

  if (accept) {
    await prisma.friendship.update({ where: { id: friendshipId }, data: { status: "ACCEPTED" } });
  } else {
    await prisma.friendship.delete({ where: { id: friendshipId } });
  }

  return { error: null };
}

// Lets the requester withdraw a request they sent before it's been answered.
export async function cancelFriendRequest(friendshipId: number) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Unauthorized. Please log in again." };

  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship || friendship.requesterId !== currentUser.id || friendship.status !== "PENDING") {
    return { error: "Request not found." };
  }

  await prisma.friendship.delete({ where: { id: friendshipId } });

  return { error: null };
}

// Ends an existing (ACCEPTED) friendship. Either side can do this.
export async function removeFriend(friendshipId: number) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { error: "Unauthorized. Please log in again." };

  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (
    !friendship ||
    friendship.status !== "ACCEPTED" ||
    (friendship.requesterId !== currentUser.id && friendship.addresseeId !== currentUser.id)
  ) {
    return { error: "Friendship not found." };
  }

  await prisma.friendship.delete({ where: { id: friendshipId } });

  return { error: null };
}
