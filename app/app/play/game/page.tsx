import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ROUTES } from "@/config/routes";
import PhaserLoader from "@/components/game/PhaserLoader";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";

const DIFFICULTIES: readonly Difficulty[] = ["facile", "moyen", "difficile"];

/**
 * /play/game?mode=solo|multiplayer&difficulty=…&deckId=… — the match page. Mode, difficulty and
 * deck come from the query string (validated here, and again by the game server), the card back
 * from the user's settings.
 */
export default async function PlayGamePage({ searchParams }: { searchParams: Promise<{ mode?: string; difficulty?: string; deckId?: string }> }) {
  const session = await getSession();
  if (!session) redirect(ROUTES.home);

  const params = await searchParams;
  const mode: GameMode = params.mode === "solo" ? "solo" : "multiplayer";
  const difficulty: Difficulty = DIFFICULTIES.find((d) => d === params.difficulty) ?? "moyen";

  const deckId = Number(params.deckId);
  if (!Number.isInteger(deckId) || deckId <= 0)
    redirect("/play");

  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { cardBack: true } });
  const cardBack = user?.cardBack ?? 0;

  return (
    <div>
      <PhaserLoader mode={mode} difficulty={difficulty} deckId={deckId} cardBack={cardBack} />
    </div>
  );
}
