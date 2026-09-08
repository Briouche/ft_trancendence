"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Phaser from "phaser";
import { createGameConfig, GameMode } from "@/game/GameConfig";
import { EventManager } from "@/game/EventManager";
import type { Difficulty } from "@/game/shared/protocol";

// Mounts the actual Phaser game into a plain div — dynamically imported with ssr:false by
// PhaserLoader.tsx, since Phaser needs a real DOM/canvas that doesn't exist during SSR.
export default function GameLauncher({ mode, difficulty, deckId, cardBack }: { mode: GameMode; difficulty: Difficulty; deckId: number; cardBack: number })
{
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const router = useRouter();

  useEffect(() => {
    // gameRef guard prevents a second Phaser.Game from being created if this effect re-runs
    // (e.g. React StrictMode's double-invoke in dev) while one is already mounted.
    if (!containerRef.current || gameRef.current)
      return;

    gameRef.current = new Phaser.Game(createGameConfig(containerRef.current, mode, difficulty, deckId, cardBack));

    const goHome = () => router.push("/");
    EventManager.on("phaser:navigateHome", goHome);

    return () => {
      EventManager.off("phaser:navigateHome", goHome);
      gameRef.current?.destroy(true);
      gameRef.current = null;
      };
// router is left out of the dependency list: the game is torn down and rebuilt only when the
// match's own params change, not when the router instance is recreated.
    }, [mode, difficulty, deckId, cardBack]);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh", overflow: "hidden" }} />;
}
