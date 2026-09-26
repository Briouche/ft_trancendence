import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import { areFriends } from "@/lib/friends";
import { getConversation, sendMessage } from "@/lib/messages";
import { rateLimit } from "@/lib/rateLimit";
import { idSchema, messageContentSchema } from "@/lib/validation";

type Params = { params: Promise<{ userId: string }> };

/** Resolves the :userId param and checks the two users are friends (only friends can chat). */
async function resolvePeer(userId: number, params: Params["params"]): Promise<number | NextResponse> {
  const peer = idSchema.safeParse((await params).userId);
  if (!peer.success) return jsonError(404, "Not found");
  if (!(await areFriends(userId, peer.data))) return jsonError(403, "You can only chat with your friends.");
  return peer.data;
}

/** GET /api/messages/:userId?before=<messageId> — one page of the conversation, oldest first. */
export async function GET(request: Request, { params }: Params) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const peerId = await resolvePeer(auth.userId, params);
  if (peerId instanceof NextResponse) return peerId;

  const beforeRaw = new URL(request.url).searchParams.get("before");
  const before = beforeRaw === null ? undefined : idSchema.safeParse(beforeRaw);
  if (before && !before.success) return jsonError(400, "Invalid cursor");

  return NextResponse.json({ messages: await getConversation(auth.userId, peerId, before?.data) });
}

const sendSchema = z.object({ content: messageContentSchema });

/** POST /api/messages/:userId { content } — sends a message to a friend. */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const peerId = await resolvePeer(auth.userId, params);
  if (peerId instanceof NextResponse) return peerId;

  const body = await parseJsonBody(request, sendSchema);
  if (body instanceof NextResponse) return body;

  // 20 messages per 10 seconds: plenty for a conversation, not enough to flood someone.
  if (!rateLimit(`chat:${auth.userId}`, { max: 20, windowMs: 10_000 })) {
    return jsonError(429, "You are sending messages too fast.");
  }

  const message = await sendMessage(auth.userId, peerId, body.content);
  return NextResponse.json({ message }, { status: 201 });
}
