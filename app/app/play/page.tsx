"use client";

import { useRouter } from "next/navigation";

export default function PlayPage()
{
  const router = useRouter();

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: "1rem" }}>
      <h1>Choisis ton mode de jeu</h1>
      <button onClick={() => router.push("/play/game?mode=solo")}>
        Solo (vs IA)
      </button>
      <button onClick={() => router.push("/play/game?mode=multiplayer")}>
        Multijoueur
      </button>
    </div>
  );
}
