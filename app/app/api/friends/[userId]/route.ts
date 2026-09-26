import { NextResponse } from "next/server";
import { jsonError, requireSession } from "@/lib/api";
import { removeFriend } from "@/lib/friends";
import { idSchema } from "@/lib/validation";

/** DELETE /api/friends/:userId — ends the friendship with that user. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const friendId = idSchema.safeParse((await params).userId);
  if (!friendId.success) return jsonError(404, "Not found");

  if (!(await removeFriend(auth.userId, friendId.data))) return jsonError(404, "Not a friend");
  return NextResponse.json({ ok: true });
}
