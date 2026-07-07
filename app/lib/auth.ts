import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
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

/**
 * Shared core for every "who is the current user" lookup.
 *
 * Centralizing this guarantees the tokenVersion check (logout-everywhere /
 * password-change / suspected-compromise invalidation) can never be
 * accidentally skipped by a future function the way `getUserDetails` used
 * to. `tokenVersion` is always fetched internally for that check, in
 * addition to whatever fields the caller asks for via `select` — callers
 * should strip it before forwarding the result to a Client Component,
 * since it's an internal implementation detail with no UI purpose.
 */
async function getAuthenticatedUser<T extends Prisma.UserSelect>(
  select: T,
): Promise<Prisma.UserGetPayload<{ select: T }> | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload) return null;

  // 1. Force the database query to return both the requested select fields AND tokenVersion
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { ...select, tokenVersion: true } as Prisma.UserSelect,
  });

  // 2. Safely check the mismatch
  if (!user || (user as any).tokenVersion !== payload.tokenVersion) return null;

  // 3. Delete tokenVersion before returning so it matches the expected Promise type perfectly
  const { tokenVersion, ...sanitizedUser } = user as any;

  return sanitizedUser as Prisma.UserGetPayload<{ select: T }>;
}

// Wrapped in React's cache() so multiple Server Components rendered in
// the same request (e.g. a layout and a page both calling this) share
// one result instead of each re-verifying the JWT and re-querying the
// DB. The cache is scoped per request, so this is safe across users.
export const verifyUserCookie = cache(() =>
  getAuthenticatedUser({
    id: true,
    email: true,
    emailVerified: true,
    twoFactorEnabled: true,
  }),
);

// Fuller field set for screens like "edit profile" that need to display
// and let the user change their own details.
export const getUserDetails = cache(() =>
  getAuthenticatedUser({
    id: true,
    username: true,
    email: true,
    avatar: true,
    status: true,
    emailVerified: true,
    twoFactorEnabled: true,
    createdAt: true,
  }),
);
