import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

const COOKIE_NAME = "token";
const COOKIE_LIFE = 7;

interface JwtPayload {
  userId: number;
  tokenVersion: number;
}

// Helper function to safely fetch and encode the secret ONLY at runtime
function getSecret(): Uint8Array {
  const rawSecret = process.env.JWT_SECRET;
  if (!rawSecret) {
    throw new Error(
      "Critical Error: JWT_SECRET environment variable is not set at runtime.",
    );
  }
  return new TextEncoder().encode(rawSecret);
}

export async function signAuthToken(payload: JwtPayload) {
  const secret = getSecret(); // Fetched at runtime
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_LIFE}d`)
    .sign(secret);
}

async function verifyAuthToken(token: string): Promise<JwtPayload | null> {
  try {
    const secret = getSecret(); // Fetched at runtime
    const { payload } = await jwtVerify(token, secret);
    if (
      typeof payload.userId !== "number" ||
      typeof payload.tokenVersion !== "number"
    ) {
      return null;
    }
    return payload as unknown as JwtPayload;
  } catch {
    return null; // expired or tampered
  }
}

export async function setAuthCookie(token: string) {
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * COOKIE_LIFE,
  });
}

export async function clearAuthCookie() {
  (await cookies()).delete(COOKIE_NAME);
}

// Wrapped in React's cache() so multiple Server Components rendered in
// the same request (e.g. a layout and a page both calling this) share
// one result instead of each re-verifying the JWT and re-querying the
// DB. The cache is scoped per request, so this is safe across users.
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      username: true,
      avatar: true,
      status: true,
      tokenVersion: true,
      emailVerified: true,
      twoFactorEnabled: true,
    },
  });

  // tokenVersion mismatch => password changed / logged out everywhere
  if (!user || user.tokenVersion !== payload.tokenVersion) return null;

  return user;
});
