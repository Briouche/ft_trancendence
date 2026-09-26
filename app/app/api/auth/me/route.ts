import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { getSession } from "@/lib/session";

/**
 * GET /api/auth/me — identity behind the session cookie, or 401.
 *
 * Also how socket-server authenticates its connections: it forwards the handshake's Cookie header
 * here, so the chat socket applies exactly the same checks as the app (signature, expiry, and
 * tokenVersion for revoked sessions) without its own database access.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return jsonError(401, "Unauthorized");
  return NextResponse.json({ id: session.userId, username: session.username });
}
