import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/cookieSession";
import { parseDeckBody } from "@/lib/decks/parseDeckBody";
import { parseDeckId } from "@/lib/decks/requirements";

// Update or delete one of the current user's decks; a deck they don't own reads as 404.

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deckId = parseDeckId((await params).id);
  if (deckId === null) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.deck.findFirst({ where: { id: deckId, userId: session.userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = await parseDeckBody(session.userId, await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const { name, cards } = parsed.deck;

  // One transaction so a failed rewrite can't leave the deck emptied.
  const [, deck] = await prisma.$transaction([
    prisma.deckCard.deleteMany({ where: { deckId } }),
    prisma.deck.update({
      where: { id: deckId },
      data: { name, cards: { create: cards } },
    }),
  ]);

  return NextResponse.json(deck);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deckId = parseDeckId((await params).id);
  if (deckId === null) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Ownership check and delete in one statement; its DeckCard rows go with it (onDelete: Cascade).
  const { count } = await prisma.deck.deleteMany({ where: { id: deckId, userId: session.userId } });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
