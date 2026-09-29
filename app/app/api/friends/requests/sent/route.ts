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
      requesterId: session.userId,
    },
    include: {
      addressee: { select: FRIEND_ROW_SELECT },
    },
    orderBy: { createdAt: "desc" },
  });

  const pendingRequests = requests.map((r) => ({
    friendshipId: r.id,
    addressee: r.addressee,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ requests: pendingRequests });
}
