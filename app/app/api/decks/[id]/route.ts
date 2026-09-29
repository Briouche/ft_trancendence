import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/cookieSession";

// Update or delete one of the current user's decks; a deck they don't own reads as 404.

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name, cards } = await req.json();

  const existing = await prisma.deck.findFirst({ where: { id: Number(id), userId: session.userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.deckCard.deleteMany({ where: { deckId: Number(id) } });

  const deck = await prisma.deck.update({
    where: { id: Number(id) },
    data: {
      name,
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const existing = await prisma.deck.findFirst({ where: { id: Number(id), userId: session.userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.deckCard.deleteMany({ where: { deckId: Number(id) } });
  await prisma.deck.delete({ where: { id: Number(id) } });

  return NextResponse.json({ ok: true });
}
