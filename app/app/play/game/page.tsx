import type { Metadata } from "next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/cookieSession";
import PhaserLoader from "@/components/game/PhaserLoader";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";

export const metadata: Metadata = { title: "Match" };

// Match page: mode/difficulty/deck come from the query string, the card back from the user.
export default async function PlayGamePage({ searchParams }: { searchParams: Promise<{ mode?: string; difficulty?: string; deckId?: string }> }) {
  const params = await searchParams;
  const mode: GameMode = params.mode === "solo" ? "solo" : "multiplayer";
  const difficulty: Difficulty = (params.difficulty as Difficulty) ?? "moyen";

  const deckId = Number(params.deckId);
  if (!Number.isInteger(deckId) || deckId <= 0)
    redirect("/play");

  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({ where: { id: session.userId }, select: { cardBack: true } })
    : null;
  const cardBack = user?.cardBack ?? 0;

  return (
    <div>
      <PhaserLoader mode={mode} difficulty={difficulty} deckId={deckId} cardBack={cardBack} />
    </div>
  );
}
