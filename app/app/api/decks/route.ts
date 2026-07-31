import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { name, cards } = await req.json();

  const deck = await prisma.deck.create({
    data: {
      name,
      userId: 1, // TODO: remplacer par l'utilisateur connecté quand l'auth sera en place
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
