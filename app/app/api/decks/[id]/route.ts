import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { parseDeckId, validateDeckInput } from "@/lib/decks";

// Update or delete one of the current user's decks; a deck they don't own reads as 404.

/** PUT /api/decks/:id — replaces the name and cards of one of the current user's decks (validated like POST). */
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

  const body = await req.json().catch(() => null);
  const result = await validateDeckInput(body, session.userId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  // One transaction so a failure can't leave the deck emptied of its cards.
  const [, deck] = await prisma.$transaction([
    prisma.deckCard.deleteMany({ where: { deckId } }),
    prisma.deck.update({
      where: { id: deckId },
      data: { name: result.deck.name, cards: { create: result.deck.cards } },
    }),
  ]);

  return NextResponse.json(deck);
}

/** DELETE /api/decks/:id — deletes one of the current user's decks (its cards go with it). */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const deckId = parseDeckId((await params).id);
  if (deckId === null) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // deleteMany scoped by owner: a no-op on someone else's deck. DeckCard rows go with it
  // (onDelete: Cascade in the schema).
  const { count } = await prisma.deck.deleteMany({ where: { id: deckId, userId: session.userId } });
  if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
