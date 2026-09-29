import { NextResponse } from "next/server";
<<<<<<< HEAD
import { z } from "zod";
import { jsonError, parseJsonBody, requireSession } from "@/lib/api";
import { listRequests, sendFriendRequest, type SendRequestResult } from "@/lib/friends";
import { usernameSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rateLimit";
=======
import { getSession } from "@/lib/auth/cookieSession";
import prisma from "@/lib/prisma";
import { FRIEND_ROW_SELECT } from "@/lib/user-and-friends/requirements";
>>>>>>> origin/merge/readme-review-dev

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

// Message and success flag for each outcome of sendFriendRequest.
const OUTCOMES: Record<SendRequestResult, { ok: boolean; message: string }> = {
  sent: { ok: true, message: "Friend request sent." },
  accepted: { ok: true, message: "You are now friends." },
  self: { ok: false, message: "You can't add yourself." },
  not_found: { ok: false, message: "No player with that username." },
  already_friends: { ok: false, message: "You are already friends." },
  already_sent: { ok: false, message: "Request already sent." },
};

/**
 * POST /api/friends/requests { username } — sends a friend request (or accepts theirs).
 *
 * Every *expected* outcome, including "no such player" or "already friends", is a 200 with
 * `{ ok, result, message }`: they are normal answers to what the user typed, and a 4xx would be
 * printed as an error in the browser console on every typo. Real errors keep their status
 * (400 malformed body, 401 signed out, 429 rate limited).
 */
export async function POST(request: Request) {
  const auth = await requireSession();
  if (auth instanceof NextResponse) return auth;

  const body = await parseJsonBody(request, sendSchema);
  if (body instanceof NextResponse) return body;

  if (!rateLimit(`friend-request:${auth.userId}`, { max: 30, windowMs: 60 * 60 * 1000 })) {
    return jsonError(429, "Too many friend requests, try again later.");
  }

<<<<<<< HEAD
  const result = await sendFriendRequest(auth.userId, body.username);
  const { ok, message } = OUTCOMES[result];
  return NextResponse.json(ok ? { ok, result, message } : { ok, result, error: message });
=======
  const requests = await prisma.friendship.findMany({
    where: {
      status: "PENDING",
      addresseeId: session.userId,
    },
    include: {
      requester: { select: FRIEND_ROW_SELECT },
    },
    orderBy: { createdAt: "desc" },
  });

  const friendRequests = requests.map((r) => ({
    friendshipId: r.id,
    requester: r.requester,
    createdAt: r.createdAt,
  }));

  return NextResponse.json({ requests: friendRequests });
>>>>>>> origin/merge/readme-review-dev
}
