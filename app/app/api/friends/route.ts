import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api";
import { listFriends } from "@/lib/friends";

/** GET /api/friends — accepted friends of the current user, with their presence. */
export async function GET() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ friends: await listFriends(auth.userId) });
}
