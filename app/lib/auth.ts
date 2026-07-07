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
export async function getAuthenticatedUser<T extends Prisma.UserSelect>(
  select: T,
): Promise<Prisma.UserGetPayload<{ select: T }> | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload) return null;

  // Cast here: Prisma's `Exact<>` check on `select` can't unify a generic T
  // with its own intersection type (TS2719). This is a Prisma+generics
  // limitation, not a runtime risk — `tokenVersion: true` is always merged
  // in below, so it's guaranteed present on `user`.
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { ...select, tokenVersion: true } as Prisma.UserSelect,
  });

  if (!user) return null;

  // Same reasoning: assert the shape we know is true at runtime instead of
  // fighting the generic inference through GetFindResult.
  const typedUser = user as { tokenVersion: number } & Record<string, unknown>;

  if (typedUser.tokenVersion !== payload.tokenVersion) return null;

  const { tokenVersion: _tokenVersion, ...sanitizedUser } = typedUser;

  return sanitizedUser as unknown as Prisma.UserGetPayload<{ select: T }>;
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
