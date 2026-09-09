"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Phaser from "phaser";
import { createGameConfig, GameMode } from "@/game/GameConfig";
import { EventManager } from "@/game/EventManager";
import type { Difficulty } from "@/game/shared/protocol";
import SceneLoading from "@/components/library/SceneLoading";

// Mounts the actual Phaser game into a plain div — dynamically imported with ssr:false by
// PhaserLoader.tsx, since Phaser needs a real DOM/canvas that doesn't exist during SSR.
export default function GameLauncher({ mode, difficulty, deckId, cardBack }: { mode: GameMode; difficulty: Difficulty; deckId: number; cardBack: number })
{
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const router = useRouter();
  const [isBoardReady, setIsBoardReady] = useState(false);

  // Covers boot (asset preload, font load, socket round trip, server-side deck resolution) with a
  // loading screen instead of a blank canvas — the board/hand only exist once the first state
  // arrives (see StateSyncController), so that's the earliest point the game is actually playable.
  useEffect(() => {
    const onState = () => setIsBoardReady(true);
    EventManager.on("server:state", onState);
    return () => { EventManager.off("server:state", onState); };
  }, []);

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
      // The socket (see EventManager.ts) is a page-lifetime singleton that survives this
      // component unmounting — client-side navigation away from the game never disconnects it —
      // so leaving mid-match (e.g. browser back) would otherwise never reach the server at all.
      // A redundant quit after a legitimate game-over is a safe no-op server-side.
      EventManager.emit("client:quit");
      gameRef.current?.destroy(true);
      gameRef.current = null;
      };
// router is left out of the dependency list: the game is torn down and rebuilt only when the
// match's own params change, not when the router instance is recreated.
    }, [mode, difficulty, deckId, cardBack]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", overflow: "hidden" }} />
      {!isBoardReady && (
        <div style={{ position: "absolute", inset: 0 }}>
          <SceneLoading />
        </div>
      )}
    </div>
  );
}
