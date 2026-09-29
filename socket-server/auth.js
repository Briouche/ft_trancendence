// Handshake checks for the chat/presence socket: same-origin browser requests only, and a valid
// app session behind the cookie.

const APP_INTERNAL_URL = process.env.APP_INTERNAL_URL || "http://app:3000";
// The app compiles a route on its first hit in dev, which can take several seconds.
const AUTH_TIMEOUT_MS = 15_000;

/**
 * Whether a handshake comes from a page of this site. Browsers always send Origin on WebSocket
 * and cross-origin requests; comparing it with the Host nginx forwarded rejects another site
 * opening a socket with the visitor's cookie (cross-site WebSocket hijacking). A request without
 * Origin is not a browser page, so it carries no ambient cookie and still has to authenticate.
 * @param {import("http").IncomingMessage} req
 */
export function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

/**
 * Asks the app who the session cookie belongs to (GET /api/auth/me), so this socket applies
 * exactly the app's checks — signature, expiry, and revoked sessions (User.tokenVersion) —
 * without its own database access or copy of the JWT secret.
 * @returns {Promise<{ userId: number, username: string } | null>}
 */
async function identify(cookieHeader) {
  if (!cookieHeader) return null;
  const res = await fetch(`${APP_INTERNAL_URL}/api/auth/me`, {
    headers: { cookie: cookieHeader },
    signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
  });
  if (!res.ok) return null;
  const body = await res.json();
  return Number.isSafeInteger(body?.id) ? { userId: body.id, username: String(body.username) } : null;
}

/** socket.io middleware: sets socket.data.user before any "connection" listener runs. */
export async function authenticateSocket(socket, next) {
  try {
    const user = await identify(socket.handshake.headers.cookie);
    if (!user) return next(new Error("unauthenticated"));
    socket.data.user = user;
    next();
  } catch (err) {
    console.error(`[socket auth] ${err instanceof Error ? err.message : err}`);
    next(new Error("unauthenticated"));
  }
}
