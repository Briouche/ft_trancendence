import { redirect } from "next/navigation";
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

  return (
    <div>
      <PhaserLoader mode={mode} difficulty={difficulty} deckId={deckId} />
    </div>
  );
}

