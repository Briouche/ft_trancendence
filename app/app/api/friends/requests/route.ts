import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookieSession";
import prisma from "@/lib/prisma";
import { FRIEND_ROW_SELECT } from "@/lib/user-and-friends/requirements";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const requests = await prisma.friendship.findMany({
    where: {
      status: "PENDING",
      addresseeId: session.userId,
    },
    include: {
      requester: { select: FRIEND_ROW_SELECT },
    },
    orderBy: { createdAt: "desc" },
  });

  const friendRequests = requests.map((r) => ({
    friendshipId: r.id,
    requester: r.requester,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ requests: friendRequests });
}
