import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import PhaserLoader from "@/components/game/PhaserLoader";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";

export default async function PlayGamePage({ searchParams }: { searchParams: Promise<{ mode?: string; difficulty?: string; deckId?: string }> }) {
  const params = await searchParams;
  const mode: GameMode = params.mode === "solo" ? "solo" : "multiplayer";
  const difficulty: Difficulty = (params.difficulty as Difficulty) ?? "moyen";

  // Un deck est obligatoire pour lancer une partie (voir PlayModeSelector.tsx, qui ne construit
  // jamais cette URL sans deckId) : une visite directe/rechargement sans deckId valide renvoie au
  // choix de deck plutôt que de laisser le moteur de jeu démarrer sans deck côté serveur.
  const deckId = Number(params.deckId);
  if (!Number.isInteger(deckId) || deckId <= 0)
    redirect("/play");

  // Dos de carte cosmétique équipé par le joueur (Collection/profil, voir lib/cardBacks.ts) —
  // 0 (le premier, offert d'office à tout le monde) si la session est introuvable, plutôt que de
  // bloquer cette page qui n'a jamais fait de vérif de session jusqu'ici.
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

