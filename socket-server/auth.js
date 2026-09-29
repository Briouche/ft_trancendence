import { parseCookie as parseCookies } from "cookie";
import { jwtVerify } from "jose";

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

    socket.data.user = payload;
    next();
  } catch (err) {
    console.error(`[Socket Auth Failed]: ${err.name} - ${err.message}`);
    next(new Error("Authentication error: Invalid session token"));
  }
}
