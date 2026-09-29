import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookieSession";
import prisma from "@/lib/prisma";
import { FRIEND_ROW_SELECT } from "@/lib/user-and-friends/requirements";
import { withStatus } from "@/lib/user-and-friends/getUserInfo";

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

  const requesters = await withStatus(requests.map((r) => r.requester));
  const friendRequests = requests.map((r, i) => ({
    friendshipId: r.id,
    requester: requesters[i],
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ requests: friendRequests });
}
