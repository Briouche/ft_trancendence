import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/cookieSession";
import { parseDeckBody } from "@/lib/decks/parseDeckBody";

// Creates a deck for the current user.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = await parseDeckBody(session.userId, await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { name, cards } = parsed.deck;

  const deck = await prisma.deck.create({
    data: {
      name,
      userId: session.userId,
      cards: { create: cards },
    },
  });

  return NextResponse.json(deck);
}
