"use server";

import { revalidatePath } from "next/cache";

import { hash, verify } from "@node-rs/argon2";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

import { createSession, getSession } from "@/lib/auth/cookieSession";
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
} from "@/lib/auth/requirements";

import {
  AVATAR_MAX_BYTES,
  AVATAR_MAX_LABEL,
  AVATAR_ALLOWED_MIME_TYPES,
} from "@/lib/user-and-friends/requirements";
import { isRateLimited, recordAttempt } from "@/lib/rateLimit";

const CURRENT_PASSWORD_FAILURES = { max: 10, windowMs: 15 * 60 * 1000 };

// File.type is whatever the browser (or a hand-crafted request) claims — identify the image
// from its leading "magic" bytes instead, and store it under that type.
function detectImageMimeType(bytes: Buffer): string | null {
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  const header = bytes.subarray(0, 12).toString("latin1");
  if (header.startsWith("GIF87a") || header.startsWith("GIF89a")) return "image/gif";
  if (header.startsWith("RIFF") && header.slice(8, 12) === "WEBP") return "image/webp";
  return null;
}

/**
 * Saves the profile form: username, email, optional new password (current password required to
 * change email or password), optional avatar. Re-issues the session cookie, since a password
 * change bumps tokenVersion and revokes every other session.
 */
export async function updateUserProfile(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized. Please log in again." };
  }

  const username = getStringField(formData, "username")?.trim();
  const email = getStringField(formData, "email")?.trim().toLocaleLowerCase() ?? null;
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");
  const currentPassword = formData.get("currentPassword");

  if (
    !username ||
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH ||
    !USERNAME_REGEX.test(username)
  ) {
    return {
      error:
        `Username must be ${USERNAME_MIN_LENGTH}-${USERNAME_MAX_LENGTH} characters and contain only letters and numbers.`,
    };
  }

  if (!email || email.length > EMAIL_MAX_LENGTH || !EMAIL_REGEX.test(email)) {
    return { error: "Please provide a valid email address." };
  }

  const avatarFile = formData.get("avatar");
  let avatarDataUri: string | undefined;

  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (avatarFile.size > AVATAR_MAX_BYTES) {
      return { error: `Avatar must be smaller than ${AVATAR_MAX_LABEL}.` };
    }

    const buffer = Buffer.from(await avatarFile.arrayBuffer());
    const mimeType = detectImageMimeType(buffer);
    if (!mimeType || !AVATAR_ALLOWED_MIME_TYPES.includes(mimeType)) {
      return { error: "Avatar must be a PNG, JPEG, WEBP, or GIF image." };
    }
    avatarDataUri = `data:${mimeType};base64,${buffer.toString("base64")}`;
  }

  const isChangingPassword = typeof password === "string" && password.length > 0;

  const existing = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, password: true },
  });
  if (!existing) {
    return { error: "Unauthorized. Please log in again." };
  }

  // Password and email are what an account is recovered/taken over with, so changing either one
  // requires re-entering the current password — a stolen session cookie alone isn't enough.
  // OAuth-only accounts (no password yet) have nothing to re-enter and skip this check.
  if ((isChangingPassword || email !== existing.email) && existing.password) {
    if (
      typeof currentPassword !== "string" ||
      currentPassword.length === 0 ||
      currentPassword.length > PASSWORD_MAX_LENGTH
    ) {
      return { error: "Enter your current password to change your email or password." };
    }
    // Same limit as sign-in failures: a stolen session must not be able to guess the password
    // from here either.
    const attemptsKey = `profile-password:user:${session.userId}`;
    if (isRateLimited(attemptsKey, CURRENT_PASSWORD_FAILURES)) {
      return { error: "Too many attempts. Please wait a few minutes and try again." };
    }
    const isValid = await verify(existing.password, currentPassword).catch(() => false);
    if (!isValid) {
      recordAttempt(attemptsKey, CURRENT_PASSWORD_FAILURES);
      return { error: "Current password is incorrect." };
    }
  }

  let passwordHash: string | undefined;

  if (isChangingPassword) {
    if (password.length > PASSWORD_MAX_LENGTH || !PASSWORD_REGEX.test(password)) {
      return {
        error:
          "Password must be 8-128 characters long, include an uppercase letter, a lowercase letter, and a number, " +
          "and contain only letters, numbers, and the symbols !@#$%^&*_+-=.,?~",
      };
    }

    if (typeof confirmPassword !== "string" || password !== confirmPassword) {
      return { error: "Passwords do not match." };
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
        // Bumping tokenVersion invalidates every other session's cookie (see getSession) — the
        // createSession below re-issues this one with the new version so it stays logged in.
        ...(passwordHash ? { password: passwordHash, tokenVersion: { increment: 1 } } : {}),
        ...(avatarDataUri ? { avatar: avatarDataUri } : {}),
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
