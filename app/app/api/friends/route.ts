import { NextResponse } from "next/server";
<<<<<<< HEAD
import { requireSession } from "@/lib/api";
import { listFriends } from "@/lib/friends";
=======
import { getSession } from "@/lib/auth/cookieSession";
import prisma from "@/lib/prisma";
import { FRIEND_ROW_SELECT } from "@/lib/user-and-friends/requirements";
>>>>>>> origin/merge/readme-review-dev

/** GET /api/friends — accepted friends of the current user, with their presence. */
export async function GET() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

<<<<<<< HEAD
  return NextResponse.json({ friends: await listFriends(auth.userId) });
=======
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
>>>>>>> origin/merge/readme-review-dev
}
