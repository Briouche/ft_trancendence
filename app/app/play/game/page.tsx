import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth/cookieSession";
import PhaserLoader from "@/components/game/PhaserLoader";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";

export default async function PlayGamePage({ searchParams }: { searchParams: Promise<{ mode?: string; difficulty?: string; deckId?: string }> }) {
  const params = await searchParams;
  const mode: GameMode = params.mode === "solo" ? "solo" : "multiplayer";
  const difficulty: Difficulty = (params.difficulty as Difficulty) ?? "moyen";

  // A deck is required to start a match: a direct visit/reload without a valid deckId redirects
  // back to deck choice (PlayModeSelector.tsx never builds this URL without one).
  const deckId = Number(params.deckId);
  if (!Number.isInteger(deckId) || deckId <= 0)
    redirect("/play");

  // Cosmetic card back (see lib/cardBacks.ts) — defaults to 0 if the session can't be found,
  // rather than blocking a page that has never required a session check.
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

