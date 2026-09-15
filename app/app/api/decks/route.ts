import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";

// Creates a deck for the current user.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, cards } = await req.json();

  const deck = await prisma.deck.create({
    data: {
      name,
      userId: session.userId,
      cards: {
        create: cards.map((c: { cardId: string; qty: number }) => ({
          cardId: c.cardId,
          qty: c.qty,
        })),
      },
    },
  });

  return NextResponse.json(deck);
}
