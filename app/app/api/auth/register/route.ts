import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";

import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { signAuthToken, setAuthCookie } from "@/lib/auth";
import { rateLimit, getClientIp, retryAfterHeader } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const MIN_PASSWORD_LENGTH = 8;

const IP_LIMIT = 5;
const IP_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  // Limit requests
  const ip = getClientIp(req);
  const ipLimit = rateLimit(`register:ip:${ip}`, IP_LIMIT, IP_WINDOW_MS);
  if (!ipLimit.success) {
    return NextResponse.json(
      {
        error:
          "Too many accounts created from this network. Please try again later.",
      },
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

  const { email, username, password, confirmPassword } = (body ?? {}) as {
    email?: unknown;
    username?: unknown;
    password?: unknown;
    confirmPassword?: unknown;
  };

  if (
    typeof email !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof confirmPassword !== "string" ||
    !email ||
    !username ||
    !password ||
    !confirmPassword
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Check size and refuse too big to avoid DDOS
  if (
    email.length > 100 ||
    username.length > 100 ||
    password.length > 100 ||
    confirmPassword.length > 100
  ) {
    return NextResponse.json({ error: "Body too big" }, { status: 400 });
  }

  // Check that both passwords match
  if (confirmPassword !== undefined && confirmPassword !== password) {
    return NextResponse.json(
      { error: "Passwords don't match" },
      { status: 400 },
    );
  }

  // Normalise strings for save storage in database
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim().toLowerCase();

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 },
    );
  }

  if (!USERNAME_REGEX.test(normalizedUsername)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3-20 characters and contain only letters, numbers, and underscores",
      },
      { status: 400 },
    );
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 400 },
    );
  }

  // Fast-path check for a friendlier error message (best-effort, not atomic).
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
    },
  });
  if (existing) {
    return NextResponse.json(
      {
        error:
          existing.email === normalizedEmail
            ? "That email is already registered"
            : "That username is taken",
      },
      { status: 409 },
    );
  }

  const hashed = await argon2.hash(password, { type: argon2.argon2id });

  // Create user in database
  let user;
  try {
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        password: hashed,
      },
    });
  } catch (err) {
    // Handles the race where two requests pass the pre-check simultaneously.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 409 },
      );
    }
    throw err;
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
