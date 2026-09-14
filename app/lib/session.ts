import "server-only";

import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserStatus } from "@prisma/client";
import prisma from "@/lib/prisma";

function getEncodedKey() {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secretKey);
}

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type SessionPayload = {
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
  status: UserStatus;
  createdAt: Date;
  elo: number;
};

async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey());
}

export async function decrypt(token: string | undefined = "") {
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

export async function createSession(userId: number, username: string, tokenVersion: number) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encrypt({ userId, username, tokenVersion, expiresAt: expiresAt.toISOString() });

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

// Wrapped in React's cache() so multiple calls within the same request
// (e.g. from both Header and a page component) only verify the JWT once
// (and only look up the current tokenVersion once).
export const getSession = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;

  const payload = await decrypt(token);
  if (!payload) return null;

  // Reject sessions issued before a logout-everywhere, password change, or
  // suspected compromise bumped the user's tokenVersion in the DB.
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { tokenVersion: true },
  });
  if (!user || user.tokenVersion !== payload.tokenVersion) return null;

  return payload;
});

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { username: true, email: true, avatar: true, status: true, createdAt: true, elo: true },
  });
  if (!user) return null;

  return { id: session.userId, ...user };
});
