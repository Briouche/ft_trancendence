"use client";

import dynamic from "next/dynamic";
import type { GameMode } from "@/game/GameConfig";

const GameLauncher = dynamic(() => import("@/components/game/GameLauncher"), { ssr: false });

export default function PhaserLoader({ mode }: { mode: GameMode })
{
  return <GameLauncher mode={mode} />;
}
