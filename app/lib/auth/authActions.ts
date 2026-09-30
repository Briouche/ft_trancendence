"use server";

import { redirect } from "next/navigation";

import { hash, verify } from "@node-rs/argon2";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { giveStarterDeck } from "@/lib/starterDecks";
import { createSession, deleteSession } from "@/lib/auth/cookieSession";
import { ROUTES } from "@/config/routes";
import { ARGON2_OPTIONS, DUMMY_HASH } from "@/lib/auth/requirements";
import { firstIssue, formDataToObject, registerSchema, signInSchema } from "@/lib/validation";
import { clientIp, isRateLimited, rateLimit, recordAttempt } from "@/lib/rateLimit";

// Server actions: sign-in, registration, sign-out. They are public endpoints, so every input is
// re-validated here whatever the form already checked.

type ActionResult = { error: string | null };

const INVALID_CREDENTIALS = "Invalid email, username or password.";
const TOO_MANY_ATTEMPTS = "Too many attempts. Please wait a few minutes and try again.";

// Only failed sign-ins count, per targeted account and per client IP: the first stops password
// guessing on one account, the second one machine spraying many accounts. The IP limit is higher
// because a whole school cluster can share one public IP.
const SIGN_IN_FAILURES_PER_ACCOUNT = { max: 10, windowMs: 15 * 60 * 1000 };
const SIGN_IN_FAILURES_PER_IP = { max: 50, windowMs: 15 * 60 * 1000 };
const REGISTRATIONS_PER_IP = { max: 20, windowMs: 60 * 60 * 1000 };

/**
 * Signs a user in with their email or username and password, and sets the session cookie.
 * Every failure returns the same message, so the form can't be used to find out which accounts
 * exist.
 */
export async function checkCredentials(formData: FormData): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: INVALID_CREDENTIALS };
  const identifier = parsed.data.identifier.toLowerCase();
  const { password } = parsed.data;

  const ipKey = `signin:ip:${await clientIp()}`;
  const accountKey = `signin:id:${identifier}`;
  if (isRateLimited(ipKey, SIGN_IN_FAILURES_PER_IP) || isRateLimited(accountKey, SIGN_IN_FAILURES_PER_ACCOUNT)) {
    return { error: TOO_MANY_ATTEMPTS };
  }
  const fail = (): ActionResult => {
    recordAttempt(ipKey, SIGN_IN_FAILURES_PER_IP);
    recordAttempt(accountKey, SIGN_IN_FAILURES_PER_ACCOUNT);
    return { error: INVALID_CREDENTIALS };
  };

  // Usernames can't contain "@" (letters and digits only), so the identifier's shape is enough.
  const user = await prisma.user.findUnique({
    where: identifier.includes("@") ? { email: identifier } : { username: identifier },
  });

  if (!user || !user.password) {
    // Same argon2 cost as a real check, so the response time doesn't reveal unknown accounts.
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

  if (!rateLimit(`register:ip:${await clientIp()}`, REGISTRATIONS_PER_IP)) {
    return { error: TOO_MANY_ATTEMPTS };
  }

  const passwordHash = await hash(password, ARGON2_OPTIONS);

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({ data: { username, email, password: passwordHash } });
      await giveStarterDeck(tx, created.id);
      return created;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // A taken email gets a vague answer: telling it apart would confirm that address has an
      // account. A taken username is public anyway (profiles are browsable).
      const target = err.meta?.target as string[] | undefined;
      if (target?.includes("email")) return { error: "Could not create account." };
      return { error: "This username is already taken." };
    }
    console.error("registerUser: unexpected error creating user", err);
    return { error: "Could not create account." };
  }

  await createSession(user.id, user.username, user.tokenVersion);
  return { error: null };
}

/** Clears the session cookie and goes back to the sign-in page. */
export async function logoutUser(): Promise<void> {
  await deleteSession();
  redirect(ROUTES.home);
}
