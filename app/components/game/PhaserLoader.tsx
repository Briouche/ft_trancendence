"use client";

import dynamic from "next/dynamic";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";

// ssr:false is required here: GameLauncher constructs a Phaser.Game, which needs a real
// canvas/DOM and would throw if evaluated during server-side rendering.
const GameLauncher = dynamic(() => import("@/components/game/GameLauncher"), { ssr: false });

// Thin wrapper so pages can import a component that's safe to reference from a server component
// tree — the dynamic()+ssr:false call itself must happen in a "use client" module.
export default function PhaserLoader({ mode, difficulty, deckId, cardBack }: { mode: GameMode; difficulty: Difficulty; deckId: number; cardBack: number })
{
  return <GameLauncher mode={mode} difficulty={difficulty} deckId={deckId} cardBack={cardBack} />;
}
