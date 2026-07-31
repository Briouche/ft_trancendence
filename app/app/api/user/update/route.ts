import { NextResponse } from "next/server";
import { verifyUserCookie } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: Request) {
  // Who is making this request — never trust an id from the body.
  const currentUser = await verifyUserCookie();
  if (!currentUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (
    !body ||
    typeof body.username !== "string" ||
    typeof body.email !== "string"
  ) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const username = body.username.trim();
  const email = body.email.trim();
  const avatar =
    typeof body.avatar === "string" && body.avatar.trim()
      ? body.avatar.trim()
      : null;

  if (!username || !email) {
    return NextResponse.json(
      { error: "Username and email are required." },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        username,
        avatar,
        // Changing the email address should require re-verifying it.
        ...(email !== currentUser.email ? { email, emailVerified: false } : {}),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        status: true,
        emailVerified: true,
        twoFactorEnabled: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (err: unknown) {
    // Prisma unique constraint violation (username or email taken)
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That username or email is already taken." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Could not save changes." },
      { status: 500 },
    );
  }
}
