import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookieSession";
import prisma from "@/lib/prisma";
import { FRIEND_ROW_SELECT } from "@/lib/user-and-friends/requirements";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: session.userId }, { addresseeId: session.userId }],
    },
    include: {
      requester: { select: FRIEND_ROW_SELECT },
      addressee: { select: FRIEND_ROW_SELECT },
    },
  });

  // Collapse each Friendship row down to "the other person" (friendshipId kept so the client
  // can target this specific row when removing the friend).
  const friends = friendships.map((f) => ({
    friendshipId: f.id,
    ...(f.requesterId === session.userId ? f.addressee : f.requester),
  }));

  return NextResponse.json({ friends });
}
