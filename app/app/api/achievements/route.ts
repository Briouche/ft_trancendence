import { NextResponse } from "next/server";
import { requireSession } from "@/lib/api";
import { getCardBackAchievements } from "@/lib/achievements";

/** GET /api/achievements — the card-back achievements with the current user's progress. */
export async function GET() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  return NextResponse.json({ achievements: await getCardBackAchievements(auth.userId) });
}
