"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Phaser from "phaser";
import { createGameConfig, GameMode } from "@/game/GameConfig";
import { EventManager } from "@/game/EventManager";
import type { Difficulty } from "@/game/shared/protocol";
import SceneLoading from "@/components/library/SceneLoading";

// How long to wait for the match to actually start (asset preload + font load + socket round
// trip + server-side deck resolution) before treating it as stuck rather than just slow. On a
// loaded/slow machine or DB hiccup this can otherwise sit on SceneLoading's spinner forever with
// no feedback — see EventManager.ts / serverSocket.ts for the "rejected" path this also catches.
const BOOT_TIMEOUT_MS = 12000;

/** Mounts the Phaser game into a full-viewport div (client-only, see PhaserLoader). */
export default function GameLauncher({ mode, difficulty, deckId, cardBack }: { mode: GameMode; difficulty: Difficulty; deckId: number; cardBack: number })
{
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const router = useRouter();
  // Read through a ref by the game effect below: that effect must only rebuild the Phaser game when
  // the match parameters change. Listing `router` as a dependency destroyed and recreated the game
  // (sending "quit" each time) whenever its identity changed, which stopped a reconnecting player
  // from ever sending "ready" within the 30 s grace window.
  const routerRef = useRef(router);
  useEffect(() => { routerRef.current = router; }, [router]);
  const [isBoardReady, setIsBoardReady] = useState(false);
  const [bootIssue, setBootIssue] = useState<{ kind: "timeout" | "rejected"; reason?: string } | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  // Covers boot (asset preload, font load, socket round trip, server-side deck resolution) with a
  // loading screen instead of a blank canvas — the board/hand only exist once the first state
  // arrives (see StateSyncController), so that's the earliest point the game is actually playable.
  useEffect(() => {
    if (isBoardReady) return;

    const onState = () => { setIsBoardReady(true); setBootIssue(null); };
    const onRejected = (reason: string) => setBootIssue({ kind: "rejected", reason });
    EventManager.on("server:state", onState);
    EventManager.on("server:rejected", onRejected);

    const timeoutId = window.setTimeout(() => setBootIssue((prev) => prev ?? { kind: "timeout" }), BOOT_TIMEOUT_MS);

    return () => {
      EventManager.off("server:state", onState);
      EventManager.off("server:rejected", onRejected);
      window.clearTimeout(timeoutId);
    };
    // Re-armed by retryBoot() below via retryToken, so a retry gets its own fresh timeout window.
  }, [isBoardReady, retryToken]);

  const retryBoot = () => {
    setBootIssue(null);
    setRetryToken((t) => t + 1);
    if (mode === "solo")
      EventManager.emit("client:readySolo", { difficulty, deckId, cardBack });
    else
      EventManager.emit("client:ready", { deckId, cardBack });
  };

  const cancelBoot = () => {
    EventManager.emit("client:quit");
    router.push("/");
  };

  useEffect(() => {
    if (!containerRef.current || gameRef.current)
      return;

    gameRef.current = new Phaser.Game(createGameConfig(containerRef.current, mode, difficulty, deckId, cardBack));

    const goHome = () => routerRef.current.push("/");
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
  }, [mode, difficulty, deckId, cardBack]);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", overflow: "hidden" }} />
      {!isBoardReady && (
        <div style={{ position: "absolute", inset: 0 }}>
          {bootIssue ? (
            <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-ink-950">
              <p className="max-w-md text-center font-display text-sm tracking-[0.15em] text-gold-400/90 uppercase">
                {bootIssue.kind === "rejected"
                  ? bootIssue.reason ?? "The match could not start."
                  : "Connecting is taking longer than expected..."}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={retryBoot}
                  className="rounded border border-gold-400/40 px-4 py-2 font-display text-xs tracking-[0.2em] text-gold-400 uppercase hover:bg-gold-400/10"
                >
                  Retry
                </button>
                <button
                  onClick={cancelBoot}
                  className="rounded border border-gold-400/20 px-4 py-2 font-display text-xs tracking-[0.2em] text-gold-400/70 uppercase hover:bg-gold-400/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <SceneLoading />
          )}
        </div>
      )}
    </div>
  );
}
