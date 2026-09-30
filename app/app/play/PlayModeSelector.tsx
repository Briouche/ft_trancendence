"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { Difficulty } from "@/game/shared/protocol";
import type { GameMode } from "@/game/GameConfig";
import { BOOT_IMAGE_ASSETS } from "@/game/scenes/bootAssets";
import ScaleToFit from "@/components/ScaleToFit";
import {
  NotebookScrollArea, SelectHighlight,
  woodenTableBackground, outlinedWhiteTextStyle,
} from "@/components/notebook/NotebookUI";
import { HomeButton } from "@/components/notebook/AssetButton";
import { TitleBanner } from "@/components/notebook/PageLayout";
import BoxedButton from "@/components/notebook/BoxedButton";
import { LEGENDARY_RARITY } from "@/lib/deckRules";

type SavedDeck = {
  id: number;
  name: string;
  cards: { qty: number; card: { rarity: string; legendId: string } }[];
};

// Mode/difficulty toggle: golden frame on the active choice, slight brightness on hover.
function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`travelbook-slot03a relative h-14 w-full font-display text-xl font-bold text-white
        transition-transform active:scale-95 ${!active && hovered ? 'brightness-125' : ''}`}
      style={outlinedWhiteTextStyle}
    >
      {active && <SelectHighlight className="-inset-3.5 z-10" animate={false} />}
      {children}
    </button>
  );
}

// Play screen: pick a mode (and AI difficulty), then a deck to start the match.
export default function PlayModeSelector({ decks, elo }: { decks: SavedDeck[]; elo: number }) {
  const router = useRouter();
  const [mode, setMode] = useState<GameMode>("solo");
  const [difficulty, setDifficulty] = useState<Difficulty>("moyen");
  const [hoveredDeckId, setHoveredDeckId] = useState<number | null>(null);

// Packs a win grants for the selected mode/difficulty (none vs easy AI).
  const packsForWin = mode === "multiplayer" ? 2 : difficulty === "difficile" ? 2 : difficulty === "moyen" ? 1 : 0;

  function gameUrl(deckId: number): string {
    const params = new URLSearchParams({ mode, deckId: String(deckId) });
    if (mode === "solo") params.set("difficulty", difficulty);
    return `/play/game?${params.toString()}`;
  }

  function chooseDeck(deckId: number) {
    router.push(gameUrl(deckId));
  }

  // The user always spends at least a few seconds here choosing a mode/deck, so use that idle
  // time to warm up what launching a match needs instead of paying for all of it serially after
  // the click: GameLauncher pulls in Phaser (a large bundle) and, transitively, EventManager.ts
  // whose module-level `io()` call opens the socket — see EventManager.ts. Both currently only
  // start once the user is already on /play/game with nothing rendered yet.
  useEffect(() => {
    void import("@/components/game/GameLauncher");
    // Gets BootScene's card-back/frame/UI images into the browser's HTTP cache in parallel with
    // the Phaser chunk above instead of only starting once Phaser has booted and BootScene runs.
    for (const { path } of BOOT_IMAGE_ASSETS)
      new window.Image().src = path;
  }, []);

  return (
    <div className="h-screen w-full overflow-hidden" style={woodenTableBackground}>
      <HomeButton onClick={() => router.push("/")} />

      <ScaleToFit className="h-screen pt-10" maxScale={1.3} align="start">
        <div className="flex flex-col items-center gap-4">
          <TitleBanner width="w-[900px]">PLAY</TitleBanner>

          <div className="flex h-[700px] items-stretch gap-6">
            {/* Mode + difficulty, Elo (multiplayer), pack reward. */}
            <div className="travelbook-frame4-panel flex h-[700px] w-[480px] flex-col p-6">
              <p className="mb-4 text-center font-display text-3xl font-bold text-white" style={outlinedWhiteTextStyle}>
                Game mode
              </p>
              <div className="flex flex-col gap-3">
                <ToggleButton active={mode === "multiplayer"} onClick={() => setMode("multiplayer")}>Multiplayer</ToggleButton>
                <ToggleButton active={mode === "solo"} onClick={() => setMode("solo")}>Solo (vs AI)</ToggleButton>
              </div>

              {mode === "solo" && (
                <>
                  <p className="mb-3 mt-6 text-center font-display text-3xl font-bold text-white" style={outlinedWhiteTextStyle}>
                    Difficulty
                  </p>
                  <div className="flex flex-col gap-3">
                    <ToggleButton active={difficulty === "facile"} onClick={() => setDifficulty("facile")}>Easy</ToggleButton>
                    <ToggleButton active={difficulty === "moyen"} onClick={() => setDifficulty("moyen")}>Medium</ToggleButton>
                    <ToggleButton active={difficulty === "difficile"} onClick={() => setDifficulty("difficile")}>Hard</ToggleButton>
                  </div>
                </>
              )}

              {mode === "multiplayer" && (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-center font-display text-3xl font-bold text-white" style={outlinedWhiteTextStyle}>
                    Your Elo: {elo}
                  </p>
                </div>
              )}

              <div className="mt-auto border-t border-white/20 pt-3">
                <p className="text-center font-serif text-sm text-white" style={outlinedWhiteTextStyle}>
                  Win this match : {packsForWin} pack{packsForWin !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            {/* Saved decks; clicking one starts the match. */}
            <div className="travelbook-frame4-panel flex h-[700px] w-96 flex-col p-5">
              <p className="mb-3 text-center font-display text-4xl font-bold text-white" style={outlinedWhiteTextStyle}>
                My decks
              </p>
              <p className="mb-3 text-center font-serif text-xs text-white" style={outlinedWhiteTextStyle}>
                Choose a deck to start the game.
              </p>

              <NotebookScrollArea className="-mr-6 flex-1">
                {decks.length === 0 && (
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <p className="text-center font-serif text-xs text-white/70" style={outlinedWhiteTextStyle}>
                      You don&apos;t have a deck yet.
                    </p>
                    <BoxedButton href="/deck/new" className="h-10 w-full">
                      Create a deck
                    </BoxedButton>
                  </div>
                )}
                {decks.map(d => {
                  const legendaryCards = d.cards.filter(c => c.card.rarity === LEGENDARY_RARITY);
                  const cardCount = d.cards.reduce((sum, c) => sum + c.qty, 0);
                  return (
                    <div
                      key={d.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => chooseDeck(d.id)}
                      onKeyDown={e => { if (e.key === 'Enter') chooseDeck(d.id) }}
                      onMouseEnter={() => { setHoveredDeckId(d.id); router.prefetch(gameUrl(d.id)); }}
                      onMouseLeave={() => setHoveredDeckId(null)}
                      className="travelbook-deck-frame relative mb-2 flex w-full cursor-pointer items-center gap-2 px-2 py-2"
                    >
                      {hoveredDeckId === d.id && <SelectHighlight className="inset-0 z-10" animate={false} />}
                      {legendaryCards.length > 0 && (
                        <span className="travelbook-slot ml-4 flex h-12 w-12 shrink-0 items-center justify-center">
                          {legendaryCards.map((c, i) => (
                            <Image
                              key={i}
                              src={`/textures/collection/icon-leg-${c.card.legendId}.webp`}
                              alt="Legendary"
                              width={32} height={34} unoptimized
                              className="h-9 w-auto"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          ))}
                        </span>
                      )}
                      <p className="min-w-0 flex-1 truncate text-center font-serif text-lg text-ink-text">
                        {d.name}
                      </p>
                      <span className="mr-4 shrink-0 font-serif text-xs text-ink-muted">{cardCount} cards</span>
                    </div>
                  );
                })}
              </NotebookScrollArea>
            </div>
          </div>
        </div>
      </ScaleToFit>
    </div>
  );
}
