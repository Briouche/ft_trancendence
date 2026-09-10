"use server";

import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function searchUserByUsername(usernameRaw: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const username = usernameRaw.trim().toLocaleLowerCase();
  if (!username) return null;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, avatar: true, status: true },
  });

  if (!user || user.id === currentUser.id) return null;

  return user;
}
