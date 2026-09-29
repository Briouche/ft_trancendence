import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/cookieSession";

/**
 * GET /api/auth/me — identity behind the session cookie, or 401.
 *
 * Also how socket-server authenticates its connections: it forwards the handshake's Cookie header
 * here, so the chat socket applies exactly the app's checks (signature, expiry, and tokenVersion
 * for revoked sessions) without its own database access.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ id: session.userId, username: session.username });
}
