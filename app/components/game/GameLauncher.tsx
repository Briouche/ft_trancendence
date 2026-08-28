"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Phaser from "phaser";
import { createGameConfig } from "@/game/GameConfig";
import { EventManager } from "@/game/EventManager";

export default function GameLauncher()
{
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current || gameRef.current)
      return;

    gameRef.current = new Phaser.Game(createGameConfig(containerRef.current));

    const goHome = () => router.push("/");
    EventManager.on("phaser:navigateHome", goHome);

    return () => {
      EventManager.off("phaser:navigateHome", goHome);
      gameRef.current?.destroy(true);
      gameRef.current = null;
      };
    }, [router]);

  return <div ref={containerRef} style={{ width: "100vw", height: "100vh", overflow: "hidden" }} />;
}
