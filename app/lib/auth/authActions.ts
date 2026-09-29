"use server";

import { redirect } from "next/navigation";

import { hash, verify } from "@node-rs/argon2";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

import { createSession, deleteSession } from "@/lib/auth/cookieSession";
import { ROUTES } from "@/config/routes";
import {
  USERNAME_REGEX,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  PASSWORD_REGEX,
  PASSWORD_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  EMAIL_REGEX,
  ARGON2_OPTIONS,
  DUMMY_HASH,
  getStringField,
} from "@/lib/auth/requirements";

// Server actions: login, registration, logout.

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
    return { error: "Username must be 3-30 characters and contain only letters and numbers." };
  }

  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_REGEX.test(email)) {
    return { error: "Please provide a valid email address." };
  }

  if (typeof password !== "string" || password.length > PASSWORD_MAX_LENGTH || !PASSWORD_REGEX.test(password)) {
    return {
      error:
        "Password must be 8-128 characters long, include an uppercase letter, a lowercase letter, and a number, " +
        "and contain only letters, numbers, and the symbols !@#$%^&*_+-=.,?~",
    };
  }

  if (typeof confirmPassword !== "string" || password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const passwordHash = await hash(password, ARGON2_OPTIONS);

  let user;
  try {
    user = await prisma.user.create({
      data: { username, email, password: passwordHash },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = err.meta?.target as string[] | undefined;
      if (target?.includes("email")) {
        return { error: "Could not create account." };
      }
      return { error: "This username is already taken." };
    }

    console.error("registerUser: unexpected error creating user", err);
    return { error: "Could not create account." };
  }

  await createSession(user.id, user.username, user.tokenVersion);
  // Navigate from the action itself: letting the client push "/" after the cookie is set made Next
  // re-render /register (which redirects signed-in users) mid-transition, and React's dev-mode
  // performance tracks threw "cannot have a negative time stamp" in the console.
  redirect(ROUTES.home);
}

/** Clears the session cookie and goes back to the sign-in page. */
export async function logoutUser() {
  await deleteSession();
  redirect(ROUTES.home);
}


