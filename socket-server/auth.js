import { parseCookie as parseCookies } from "cookie";
import { jwtVerify } from "jose";
import pg from "pg";

// Only used to check a session's tokenVersion against the account, same as the app
// (lib/auth/cookieSession.ts) and game_engine (srcs/auth/session.ts) do.
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, max: 5 });
pool.on("error", (err) => console.error(`[Postgres] ${err.name} - ${err.message}`));

// Authenticates via the Next.js session cookie during the socket.io handshake, so
// socket.data.user is populated before any "connection" listener runs.
export async function authenticateSocket(socket, next) {
  try {
    const rawCookies = socket.handshake.headers.cookie || "";
    const token = parseCookies(rawCookies).session;

    if (!token) {
      return next(new Error("Authentication error: No session token"));
    }

    if (!process.env.JWT_SECRET) {
      console.error("[Socket Auth Failed]: JWT_SECRET environment variable is missing.");
      return next(new Error("Authentication error: Server misconfiguration"));
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });

    if (typeof payload.userId !== "number" || typeof payload.tokenVersion !== "number") {
      return next(new Error("Authentication error: Invalid session token"));
    }

    // A valid signature isn't enough: a password change bumps User.tokenVersion to revoke every
    // other session, and a deleted account must not keep showing up as online.
    const { rows } = await pool.query('SELECT "username", "tokenVersion" FROM "User" WHERE "id" = $1', [payload.userId]);
    const user = rows[0];
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return next(new Error("Authentication error: Session revoked"));
    }

    socket.data.user = { userId: payload.userId, username: user.username };
    next();
  } catch (err) {
    console.error(`[Socket Auth Failed]: ${err.name} - ${err.message}`);
    next(new Error("Authentication error: Invalid session token"));
  }
}
