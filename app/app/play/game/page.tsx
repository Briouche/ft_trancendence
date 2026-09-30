import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/cookieSession";
import { ROUTES } from "@/config/routes";
import PhaserLoader from "@/components/game/PhaserLoader";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";

const DIFFICULTIES: readonly Difficulty[] = ["facile", "moyen", "difficile"];

/**
 * /play/game — the match itself (Phaser). Mode, difficulty and deck come from the query string
 * (set by the Play screen), the card back from the user. The game server re-validates all of it.
 */
export default async function PlayGamePage({ searchParams }: { searchParams: Promise<{ mode?: string; difficulty?: string; deckId?: string }> }) {
  const params = await searchParams;
  const mode: GameMode = params.mode === "solo" ? "solo" : "multiplayer";
  const difficulty: Difficulty = DIFFICULTIES.find((d) => d === params.difficulty) ?? "moyen";

  const deckId = Number(params.deckId);
  if (!Number.isInteger(deckId) || deckId <= 0)
    redirect("/play");

  const session = await getSession();
  if (!session) redirect(ROUTES.home);
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { cardBack: true } });
  const cardBack = user?.cardBack ?? 0;

  return (
    <div>
      <PhaserLoader mode={mode} difficulty={difficulty} deckId={deckId} cardBack={cardBack} />
    </div>
  );
}
