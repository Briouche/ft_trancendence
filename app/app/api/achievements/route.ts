import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api";
import { getAchievementStatuses } from "@/lib/achievements";

/**
 * GET /api/achievements — every achievement with the current user's progress. Also unlocks
 * whatever was reached since the last check; `newlyUnlocked` lists those keys for a notification.
 */
export async function GET() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json(await getAchievementStatuses(auth.userId));
}
