"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import { createGameConfig, GameMode } from "@/game/GameConfig";

export default function GameLauncher({ mode }: { mode: GameMode })
{
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current || gameRef.current)
      return;

    gameRef.current = new Phaser.Game(createGameConfig(containerRef.current, mode));

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
      };
    }, [mode]);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh", overflow: "hidden" }} />;
}
