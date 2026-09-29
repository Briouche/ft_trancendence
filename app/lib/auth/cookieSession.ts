// server functions to manage the session cookie
import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import prisma from "@/lib/prisma";

import { SESSION_DURATION_DAY, SESSION_DURATION_MS} from "@/lib/auth/requirements";

type SessionPayload = {
  userId: number;
  username: string;
  tokenVersion: number;
  expiresAt: string;
};

export const getSession = cache(async () => {
  // this function gets the user's session cookie
  // and checks the validity of its payload

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

export async function createSession(userId: number, username: string, tokenVersion: number) {
  // creates the session cookie to log in

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = await encrypt({ userId, username, tokenVersion, expiresAt: expiresAt.toISOString() });

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: true, // served over HTTPS in every environment (proxy/)
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function deleteSession() {
  // removes the session cookie to log out

  const cookieStore = await cookies();
  cookieStore.delete("session");
}



function getEncodedKey() {
  const secretKey = process.env.JWT_SECRET;
  if (!secretKey) throw new Error("JWT_SECRET env var is not set");
  return new TextEncoder().encode(secretKey);
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

async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime(SESSION_DURATION_DAY + "d")
  .sign(getEncodedKey());
}
