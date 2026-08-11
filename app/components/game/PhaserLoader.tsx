"use client";

import dynamic from "next/dynamic";

const GameLauncher = dynamic(() => import("@/components/game/GameLauncher"), { ssr: false });

export default function PhaserLoader()
{
  return <GameLauncher />;
}
