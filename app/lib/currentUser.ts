import "server-only";

import { cache } from "react";
import type { UserStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/cookieSession";

export type CurrentUser = {
  id: number;
  username: string;
  email: string;
  avatar: string | null;
  status: UserStatus;
  createdAt: Date;
};

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { username: true, email: true, avatar: true, status: true, createdAt: true },
  });
  if (!user) return null;

  return { id: session.userId, ...user };
});
