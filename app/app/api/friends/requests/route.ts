import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import { listRequests, sendFriendRequest, type SendRequestResult } from "@/lib/friends";
import { usernameSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimit";

/** GET /api/friends/requests — pending requests: `incoming` (to answer) and `outgoing` (sent). */
export async function GET() {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const [incoming, outgoing] = await Promise.all([
    listRequests(auth.userId, "incoming"),
    listRequests(auth.userId, "outgoing"),
  ]);
  return NextResponse.json({ incoming, outgoing });
}

const sendSchema = z.object({ username: usernameSchema });

// HTTP status and message for each outcome of sendFriendRequest.
const OUTCOMES: Record<SendRequestResult, [number, string]> = {
  sent: [201, "Friend request sent."],
  accepted: [200, "You are now friends."],
  self: [400, "You can't add yourself."],
  not_found: [404, "No player with that username."],
  already_friends: [409, "You are already friends."],
  already_sent: [409, "Request already sent."],
};

/** POST /api/friends/requests { username } — sends a friend request (or accepts theirs). */
export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const body = await parseJsonBody(request, sendSchema);
  if (body instanceof NextResponse) return body;

  if (!rateLimit(`friend-request:${auth.userId}`, { max: 30, windowMs: 60 * 60 * 1000 })) {
    return jsonError(429, "Too many friend requests, try again later.");
  }

  const result = await sendFriendRequest(auth.userId, body.username);
  const [status, message] = OUTCOMES[result];
  return status >= 400 ? jsonError(status, message) : NextResponse.json({ result, message }, { status });
}
