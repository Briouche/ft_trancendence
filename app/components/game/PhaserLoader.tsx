"use client";

import dynamic from "next/dynamic";
import SceneLoading from "@/components/home-library/SceneLoading";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";

// ssr:false is required here: GameLauncher constructs a Phaser.Game, which needs a real
// canvas/DOM and would throw if evaluated during server-side rendering. `loading` covers the gap
// while this chunk (which pulls in the whole Phaser engine) downloads/parses — without it,
// next/dynamic renders nothing at all, which reads as the page having frozen.
const GameLauncher = dynamic(() => import("@/components/game/GameLauncher"), { ssr: false, loading: SceneLoading });

/** Client-only wrapper that loads the Phaser game (see the dynamic import above) for one match. */
export default function PhaserLoader({ mode, difficulty, deckId, cardBack }: { mode: GameMode; difficulty: Difficulty; deckId: number; cardBack: number })
{
  return <GameLauncher mode={mode} difficulty={difficulty} deckId={deckId} cardBack={cardBack} />;
}
