import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

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
      requester: { select: { id: true, username: true, avatar: true, status: true } },
      addressee: { select: { id: true, username: true, avatar: true, status: true } },
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
