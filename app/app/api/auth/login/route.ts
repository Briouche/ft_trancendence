import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";

import prisma from "@/lib/prisma";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import { rateLimit, getClientIp, retryAfterHeader } from "@/lib/rate-limit";

const dummyHashPromise = argon2.hash("dummy-password-for-timing-safety", {
  type: argon2.argon2id,
});

const IP_LIMIT = 20;
const IP_WINDOW_MS = 60 * 1000;

const EMAIL_LIMIT = 5;
const EMAIL_WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  // Limit requests
  const ip = getClientIp(req);
  const ipLimit = rateLimit(`login:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);
  if (!ipLimit.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: retryAfterHeader(ipLimit.resetAt) },
    );
  }

  // Get the body and run a few checks
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
  };

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    !email ||
    !password
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Check size and refuse too big to avoid DDOS
  if (email.length > 100 || password.length > 100) {
    return NextResponse.json({ error: "Body too big" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const emailLimit = rateLimit(
    `login:email:${normalizedEmail}`,
    EMAIL_LIMIT,
    EMAIL_WINDOW_MS,
  );
  if (!emailLimit.success) {
    return NextResponse.json(
      { error: "Too many attempts for this account. Please try again later." },
      { status: 429, headers: retryAfterHeader(emailLimit.resetAt) },
    );
  }

  // Check database for user
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  const hashToCheck = user?.password ?? (await dummyHashPromise);
  const passwordValid = await argon2
    .verify(hashToCheck, password)
    .catch(() => false);

  if (!user || !user.password || !passwordValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Set sign setAuthCookie
  const token = await signAuthToken({
    userId: user.id,
    tokenVersion: user.tokenVersion,
  });
  await setAuthCookie(token);

  return NextResponse.json({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}
