import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
<<<<<<< HEAD
import { getSession } from "@/lib/session";
import { validateDeckInput } from "@/lib/decks";
=======
import { getSession } from "@/lib/auth/cookieSession";
>>>>>>> origin/merge/readme-review-dev

/** Creates a deck for the current user. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const result = await validateDeckInput(body, session.userId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const deck = await prisma.deck.create({
    data: {
      name: result.deck.name,
      userId: session.userId,
      cards: { create: result.deck.cards },
    },
  });

  return NextResponse.json(deck);
}
