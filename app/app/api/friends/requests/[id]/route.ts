import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import { answerFriendRequest, cancelFriendRequest } from "@/lib/friends";
import { idSchema } from "@/lib/validation";

type Params = { params: Promise<{ id: string }> };

const answerSchema = z.object({ action: z.enum(["accept", "decline"]) });

/** PATCH /api/friends/requests/:id { action: "accept" | "decline" } — answers a received request. */
export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const id = idSchema.safeParse((await params).id);
  if (!id.success) return jsonError(404, "Not found");

  const body = await parseJsonBody(request, answerSchema);
  if (body instanceof NextResponse) return body;

  const ok = await answerFriendRequest(auth.userId, id.data, body.action === "accept");
  return ok ? NextResponse.json({ ok: true }) : jsonError(404, "No such pending request");
}

/** DELETE /api/friends/requests/:id — cancels a request the current user sent. */
export async function DELETE(_req: Request, { params }: Params) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const id = idSchema.safeParse((await params).id);
  if (!id.success) return jsonError(404, "Not found");

  const ok = await cancelFriendRequest(auth.userId, id.data);
  return ok ? NextResponse.json({ ok: true }) : jsonError(404, "No such pending request");
}
