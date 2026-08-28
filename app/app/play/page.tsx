"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Difficulty } from "@/game/shared/protocol";

export default function PlayPage()
{
  const router = useRouter();
  const [showDifficulty, setShowDifficulty] = useState(false);

  const startSolo = (difficulty: Difficulty) =>
  {
    router.push(`/play/game?mode=solo&difficulty=${difficulty}`);
  };

  if (showDifficulty)
  {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "1rem" }}>
        <h1>Choisis la difficulté</h1>
        <button onClick={() => startSolo("facile")}>Facile</button>
        <button onClick={() => startSolo("moyen")}>Moyen</button>
        <button onClick={() => startSolo("difficile")}>Difficile</button>
        <button onClick={() => setShowDifficulty(false)}>Retour</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "1rem" }}>
      <h1>Choisis ton mode de jeu</h1>
      <button onClick={() => setShowDifficulty(true)}>
        Solo (vs IA)
      </button>
      <button onClick={() => router.push("/play/game?mode=multiplayer")}>
        Multijoueur
      </button>
    </div>
  );
}