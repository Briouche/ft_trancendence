"use client";

import dynamic from "next/dynamic";
import type { GameMode } from "@/game/GameConfig";
import type { Difficulty } from "@/game/shared/protocol";

const GameLauncher = dynamic(() => import("@/components/game/GameLauncher"), { ssr: false });

export default function PhaserLoader({ mode, difficulty }: { mode: GameMode; difficulty: Difficulty })
{
  return <GameLauncher mode={mode} difficulty={difficulty} />;
}
