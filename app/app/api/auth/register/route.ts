import { NextRequest, NextResponse } from "next/server";
import argon2 from "argon2";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { rateLimit, getClientIp, retryAfterHeader } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const MIN_PASSWORD_LENGTH = 8;

// Registration is inherently rarer than login, so a tighter, longer
// window is appropriate — mainly to blunt scripted mass account creation.
const IP_LIMIT = 5;
const IP_WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, username, password } = (body ?? {}) as {
    email?: unknown;
    username?: unknown;
    password?: unknown;
  };

  if (
    typeof email !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    !email ||
    !username ||
    !password
  ) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }

  const hashed = await argon2.hash(password, { type: argon2.argon2id });

  try {
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: normalizedUsername,
        password: hashed,
      },
    });

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
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
}
