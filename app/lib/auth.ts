"use server";

import { redirect } from "next/navigation";

import { hash, verify } from "@node-rs/argon2"
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { ROUTES } from "@/config/routes";

/** Matches the same argon2id parameters used to build {@link DUMMY_HASH}. */
const ARGON2_OPTIONS = {
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// At least 8 characters, one uppercase, one lowercase, one digit.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
// Upper bound only - argon2 cost scales with input size, so an unbounded
// password lets someone send a multi-MB string and burn CPU/memory on every
// hash/verify call. 128 is generous for any real passphrase.
const PASSWORD_MAX_LENGTH = 128;
const EMAIL_MAX_LENGTH = 254; // RFC 5321 max mailbox length

const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$c29tZXJhbmRvbXNhbHQ$2rXwn8YSrN3W5uJmYh1IhrJfw5PZqPFqUJvXWkG1SVI";

function getStringField(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function checkCredentials(formData: FormData) {
  const usernameRaw = getStringField(formData, "username");
  const passwordRaw = formData.get("password");

  if (
    !usernameRaw ||
    usernameRaw.length > USERNAME_MAX_LENGTH ||
    typeof passwordRaw !== "string" ||
    passwordRaw.length === 0 ||
    passwordRaw.length > PASSWORD_MAX_LENGTH
  ) {
    return { error: "Invalid username or password." };
  }

  const username = usernameRaw.toLocaleLowerCase();
  const password = passwordRaw;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user || !user.password) {
    // Run a dummy verify so this path costs roughly the same as the
    // "user found, wrong password" path below.
    // Note that with remote authentication, there is no password
    try {
      await verify(DUMMY_HASH, password);
    } catch {
      // ignore - dummy hash mismatch is expected
    }
    return { error: "Invalid username or password." };
  }

  try {
    const isValid = await verify(user.password, password);

    if (!isValid) {
      return { error: "Invalid username or password." };
    }
  } catch {
    return { error: "Invalid username or password." };
  }

  // JWT/session cookie
  await createSession(user.id, user.username, user.tokenVersion);

  return { error: null };
}

export async function registerUser(formData: FormData) {
  const username = getStringField(formData, "username");
  const email = getStringField(formData, "email")?.toLocaleLowerCase() ?? null;
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (
    !username ||
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH ||
    !USERNAME_REGEX.test(username)
  ) {
    return { error: "Username must be 3-30 characters and contain only letters, numbers, and underscores." };
  }

  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_REGEX.test(email)) {
    return { error: "Please provide a valid email address." };
  }

  if (typeof password !== "string" || password.length > PASSWORD_MAX_LENGTH || !PASSWORD_REGEX.test(password)) {
    return {
      error:
        "Password must be 8-128 characters long and include an uppercase letter, a lowercase letter, and a number.",
    };
  }

  if (typeof confirmPassword !== "string" || password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const passwordHash = await hash(password, ARGON2_OPTIONS);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        username: username.toLocaleLowerCase(),
        email,
        password: passwordHash,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = err.meta?.target as string[] | undefined;
      if (target?.includes("email")) {
        return { error: "Cound not create account." };
      }
      return { error: "Cound not create account." };
    }

    console.error("registerUser: unexpected error creating user", err);
    return { error: "Cound not create account." };
  }

  await createSession(user.id, user.username, user.tokenVersion);

  return { error: null };
}

export async function logoutUser() {
  await deleteSession();
  redirect(ROUTES.home);
}
