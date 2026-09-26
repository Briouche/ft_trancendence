"use server";

import { redirect } from "next/navigation";

import { hash, verify } from "@node-rs/argon2";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { ROUTES } from "@/config/routes";
import { ARGON2_OPTIONS, DUMMY_HASH } from "@/lib/constants";
import { firstIssue, formDataToObject, loginSchema, registerSchema } from "@/lib/validation";
import { clientIp, isRateLimited, rateLimit, recordAttempt } from "@/lib/rateLimit";

// Server actions: login, registration, logout.

type ActionResult = { error: string | null };

const INVALID_CREDENTIALS = "Invalid username or password.";

// Failed logins only (a successful one never counts), per targeted account and per client IP:
// the first stops password guessing on one account, the second one machine spraying many
// accounts. The IP limit is higher because a whole school cluster can share one public IP.
const LOGIN_FAILURES_PER_ACCOUNT = { max: 10, windowMs: 15 * 60 * 1000 };
const LOGIN_FAILURES_PER_IP = { max: 50, windowMs: 15 * 60 * 1000 };
const REGISTER_LIMIT = { max: 20, windowMs: 60 * 60 * 1000 };
const TOO_MANY_ATTEMPTS = "Too many attempts. Please wait a few minutes and try again.";

/**
 * Signs a user in with their username or email and password, and sets the session cookie.
 * Every failure returns the same message so the form can't be used to find out which accounts
 * exist.
 */
export async function checkCredentials(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: INVALID_CREDENTIALS };
  const { identifier, password } = parsed.data;

  const ipKey = `login:ip:${await clientIp()}`;
  const accountKey = `login:id:${identifier}`;
  if (isRateLimited(ipKey, LOGIN_FAILURES_PER_IP) || isRateLimited(accountKey, LOGIN_FAILURES_PER_ACCOUNT)) {
    return { error: TOO_MANY_ATTEMPTS };
  }
  const fail = () => {
    recordAttempt(ipKey, LOGIN_FAILURES_PER_IP);
    recordAttempt(accountKey, LOGIN_FAILURES_PER_ACCOUNT);
    return { error: INVALID_CREDENTIALS };
  };

  const user = await prisma.user.findUnique({
    where: identifier.includes("@") ? { email: identifier } : { username: identifier },
  });

  if (!user || !user.password) {
    // Same argon2 cost as a real check, so response time doesn't reveal unknown accounts.
    await verify(DUMMY_HASH, password).catch(() => false);
    return fail();
  }

  const isValid = await verify(user.password, password).catch(() => false);
  if (!isValid) return fail();

  await createSession(user.id, user.username, user.tokenVersion);
  return { error: null };
}

/** Creates an account from the registration form and signs it in. */
export async function registerUser(formData: FormData): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { username, email, password } = parsed.data;

  if (!rateLimit(`register:ip:${await clientIp()}`, REGISTER_LIMIT)) {
    return { error: TOO_MANY_ATTEMPTS };
  }

  const passwordHash = await hash(password, ARGON2_OPTIONS);

  let user;
  try {
    user = await prisma.user.create({
      data: { username, email, password: passwordHash },
    });
  } catch (err) {
    // P2002 = unique constraint (username or email taken). The message stays generic on purpose:
    // naming the taken field would let anyone probe which emails have an account.
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) {
      console.error("registerUser: unexpected error creating user", err);
    }
    return { error: "Could not create account. The username or email may already be in use." };
  }

  await createSession(user.id, user.username, user.tokenVersion);
  return { error: null };
}

/** Clears the session cookie and goes back to the sign-in page. */
export async function logoutUser() {
  await deleteSession();
  redirect(ROUTES.home);
}
