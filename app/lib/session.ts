import "server-only";

import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

// JWT session cookie: create, delete, read (with tokenVersion check) and current user lookup.

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type SessionPayload = {
  userId: number;
  username: string;
  tokenVersion: number;
  expiresAt: string;
};

export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  createdAt: Date;
  elo: number;
  // False for 42-only accounts. The hash itself never leaves the server.
  hasPassword: boolean;
  // True once "Sign in with 42" is linked to this account.
  linkedTo42: boolean;
};

function getEncodedKey() {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secretKey);
}

async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

async function decrypt(token: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.userId !== "number" ||
      typeof payload.username !== "string" ||
      typeof payload.tokenVersion !== "number"
    ) {
      return null;
    }

    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Signs a session JWT (7 days, carrying tokenVersion) and sets it as an HttpOnly, Secure,
 * SameSite=Lax cookie.
 */
export async function createSession(userId: number, username: string, tokenVersion: number) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encrypt({ userId, username, tokenVersion, expiresAt: expiresAt.toISOString() });

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: true, // every environment is served over HTTPS (proxy/)
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

/** Removes the session cookie (log out on this browser). */
export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

/**
 * Session payload, or null when the cookie is missing, invalid or issued before the user's
 * tokenVersion was bumped. Cached per request.
 */
export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const payload = await decrypt(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { tokenVersion: true },
  });
  if (!user || user.tokenVersion !== payload.tokenVersion) return null;

  return payload;
});

/** The signed-in user's account details, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { username: true, email: true, avatar: true, createdAt: true, elo: true, password: true, fortyTwoId: true },
  });
  if (!user) return null;

  const { password, fortyTwoId, ...rest } = user;
  return { id: session.userId, ...rest, hasPassword: password !== null, linkedTo42: fortyTwoId !== null };
});
