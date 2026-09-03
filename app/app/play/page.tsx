import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ROUTES } from "@/config/routes";
import PlayModeSelector from "./PlayModeSelector";

export default async function PlayPage() {
  const session = await getSession();
  if (!session) redirect(ROUTES.home);

  const decks = await prisma.deck.findMany({
    where:   { userId: session.userId },
    include: { cards: { include: { card: true } } },
    orderBy: { createdAt: "desc" },
  });

  return <PlayModeSelector decks={decks} />;
}
