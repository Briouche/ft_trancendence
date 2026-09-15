import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import prisma from "@/lib/prisma";

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
      addressee: { select: { id: true, username: true, avatar: true, status: true } },
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
