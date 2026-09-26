import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api";
import { searchUsers } from "@/lib/userSearch";
import { userSearchSchema } from "@/lib/validation";

/**
 * GET /api/users?q=&sort=elo|pvpWins|username|joined&order=asc|desc&filter=all|online|friends
 *                &page=1&pageSize=10|20|50
 * Player search and leaderboard, paginated on the server.
 */
export async function GET(request: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const params = userSearchSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
  return NextResponse.json(await searchUsers(auth.userId, params));
}
