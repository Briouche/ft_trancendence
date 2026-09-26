"use server";

import { revalidatePath } from "next/cache";

import { hash, verify } from "@node-rs/argon2";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";

import { createSession, getSession } from "@/lib/session";
import { ARGON2_OPTIONS } from "@/lib/constants";
import { firstIssue, formDataToObject, profileUpdateSchema } from "@/lib/validation";

/**
 * Server action: updates username/email and optionally the password, then refreshes the session.
 *
 * A password change requires the current password (when the account has one: 42-only accounts
 * don't) and signs out every other session, so a stolen session can't be used to lock the real
 * owner out.
 */
export async function updateUserProfile(formData: FormData): Promise<{ error: string | null }> {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized. Please log in again." };
  }

  const parsed = profileUpdateSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return { error: firstIssue(parsed.error) };
  const { username, email, password, currentPassword } = parsed.data;

  let passwordHash: string | undefined;

  if (password !== "") {
    const current = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { password: true },
    });
    if (current?.password) {
      const isValid =
        currentPassword.length > 0 && (await verify(current.password, currentPassword).catch(() => false));
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
        username,
        email,
        // Bumping tokenVersion invalidates every JWT issued so far; createSession below
        // re-issues one for this browser only.
        ...(passwordHash ? { password: passwordHash, tokenVersion: { increment: 1 } } : {}),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: await describeConflict(session.userId, username, email) };
    }

    console.error("updateUserProfile: unexpected error", err);
    return { error: "Could not update profile information." };
  }

  await createSession(updatedUser.id, updatedUser.username, updatedUser.tokenVersion);
  revalidatePath("/profile");

  return { error: null };
}

// Which field collided. Looked up explicitly: with the pg driver adapter, Prisma's P2002 error
// doesn't reliably say which constraint failed (err.meta.target can be missing).
async function describeConflict(userId: number, username: string, email: string): Promise<string> {
  const other = await prisma.user.findFirst({
    where: { id: { not: userId }, OR: [{ username }, { email }] },
    select: { username: true, email: true },
  });
  if (other?.email === email) return "Email is already in use by another account.";
  if (other?.username === username) return "Username is already taken.";
  return "Could not update profile information.";
}
