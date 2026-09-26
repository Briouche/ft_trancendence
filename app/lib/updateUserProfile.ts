"use server";

import { revalidatePath } from "next/cache";

import { hash, verify } from "@node-rs/argon2";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

import { createSession, getSession } from "@/lib/session";
import {
  ARGON2_OPTIONS,
  EMAIL_MAX_LENGTH,
  EMAIL_REGEX,
  getStringField,
  PASSWORD_MAX_LENGTH,
  PASSWORD_REGEX,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_REGEX,
} from "@/lib/constants";

// Server action: updates username/email and optionally the password, then refreshes the session.
// A password change requires the current password (when the account has one) and signs out every
// other session, so a stolen session can't be used to lock the real owner out.
export async function updateUserProfile(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized. Please log in again." };
  }

  const username = getStringField(formData, "username")?.trim();
  const email = getStringField(formData, "email")?.trim().toLocaleLowerCase() ?? null;
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (
    !username ||
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH ||
    !USERNAME_REGEX.test(username)
  ) {
    return {
      error:
        "Username must be 3-30 characters and contain only letters, numbers, and underscores.",
    };
  }

  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_REGEX.test(email)) {
    return { error: "Please provide a valid email address." };
  }

  let passwordHash: string | undefined;

  if (typeof password === "string" && password.length > 0) {
    if (password.length < 8 || password.length > PASSWORD_MAX_LENGTH || !PASSWORD_REGEX.test(password)) {
      return {
        error:
          "Password must be 8-128 characters long and include an uppercase letter, a lowercase letter, and a number.",
      };
    }

    if (typeof confirmPassword !== "string" || password !== confirmPassword) {
      return { error: "Passwords do not match." };
    }

    const current = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { password: true },
    });
    if (current?.password) {
      const currentPassword = formData.get("currentPassword");
      const isValid =
        typeof currentPassword === "string" &&
        currentPassword.length > 0 &&
        currentPassword.length <= PASSWORD_MAX_LENGTH &&
        (await verify(current.password, currentPassword).catch(() => false));
      if (!isValid) {
        return { error: "Current password is incorrect." };
      }
    }

    passwordHash = await hash(password, ARGON2_OPTIONS);
  }

  let updatedUser;
  try {
    updatedUser = await prisma.user.update({
      where: { id: session.userId },
      data: {
        username: username.toLocaleLowerCase(),
        email,
        // Bumping tokenVersion invalidates every JWT issued so far; createSession below
        // re-issues one for this browser only.
        ...(passwordHash ? { password: passwordHash, tokenVersion: { increment: 1 } } : {}),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = err.meta?.target as string[] | undefined;
      if (target?.includes("email")) {
        return { error: "Email is already in use by another account." };
      }
      if (target?.includes("username")) {
        return { error: "Username is already taken." };
      }
      return { error: "Could not update profile information." };
    }

    console.error("updateUserProfile: unexpected error", err);
    return { error: "Could not update profile information." };
  }

  await createSession(updatedUser.id, updatedUser.username, updatedUser.tokenVersion);
  revalidatePath("/profile");

  return { error: null };
}
