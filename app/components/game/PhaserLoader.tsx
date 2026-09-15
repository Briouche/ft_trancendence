"use client";

import dynamic from "next/dynamic";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";

// Client-only entry point for the Phaser game (no SSR: Phaser needs a real canvas).
const GameLauncher = dynamic(() => import("@/components/game/GameLauncher"), { ssr: false });

export default function PhaserLoader({ mode, difficulty, deckId, cardBack }: { mode: GameMode; difficulty: Difficulty; deckId: number; cardBack: number })
{
  return <GameLauncher mode={mode} difficulty={difficulty} deckId={deckId} cardBack={cardBack} />;
}
