"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Difficulty } from "@/game/shared/protocol";
import type { GameMode } from "@/game/GameConfig";
import ScaleToFit from "@/components/ScaleToFit";
import {
  HomeButton, TitleBanner, NotebookScrollArea, SelectHighlight,
  woodenTableBackground, outlinedWhiteTextStyle,
} from "@/components/notebook/NotebookUI";

type SavedDeck = {
  id: number;
  name: string;
  cards: { qty: number; card: { rarity: string; legendId: string } }[];
};

// Choice button (mode/difficulty): the golden frame (SelectHighlight) only shows for the active
// choice — otherwise it looked identical to a plain hover and you couldn't tell which one was
// really selected. Always static (animate=false, no shimmer): it's a plain fixed outline marking
// the selection, not an animation. A hovered but non-active button only gets a slight brightness
// bump, so it can't be mistaken for the actual active choice.
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
      {/* -inset-3.5 (14px) = the frame's width (borderWidth:14 in SelectHighlight): the frame is
          drawn just outside the button instead of covering its text. */}
      {active && <SelectHighlight className="-inset-3.5 z-10" animate={false} />}
      {children}
    </button>
  );
}

export default function PlayModeSelector({ decks }: { decks: SavedDeck[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<GameMode>("solo");
  const [difficulty, setDifficulty] = useState<Difficulty>("moyen");
  const [hoveredDeckId, setHoveredDeckId] = useState<number | null>(null);

  function chooseDeck(deckId: number) {
    const params = new URLSearchParams({ mode, deckId: String(deckId) });
    if (mode === "solo") params.set("difficulty", difficulty);
    router.push(`/play/game?${params.toString()}`);
  }

  return (
    // h-screen + overflow-hidden, no padding (see CollectionBook.tsx/DeckBuilder.tsx): ScaleToFit
    // below already centers/scales its content to fit the viewport exactly — any padding added
    // here on top of its own h-screen box would push the total past 100vh and force a scroll.
    <div className="h-screen w-full overflow-hidden" style={woodenTableBackground}>
      <HomeButton onClick={() => router.push("/")} />

      {/* maxScale capped well below the Collection/Deck Builder book's unbounded scale-up (compact
          title + mode cards, not viewport-sized) — align="start" glues it to the top. */}
      <ScaleToFit className="h-screen pt-10" maxScale={1.3} align="start">
        <div className="flex flex-col items-center gap-4">
          <TitleBanner width="w-[900px]">PLAY</TitleBanner>

          <div className="flex h-[700px] items-stretch gap-6">
            {/* Left: mode + difficulty. Frame04a (like the right-hand panel) rather than the
                notebook's page texture (.travelbook-page): this isn't book content to leaf
                through, just a choice panel — same distinction already made for the "My decks"
                panel in DeckBuilder.tsx. */}
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
            </div>

            {/* Right: same saved decks as DeckBuilder.tsx ("My decks"), without "Create deck" or
                deletion — clicking a deck directly launches the game with the mode chosen on the
                left. */}
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
                    <Link
                      href="/deck/new"
                      className="travelbook-slot03a flex h-10 w-full items-center justify-center font-display font-bold text-white"
                      style={outlinedWhiteTextStyle}
                    >
                      Create a deck
                    </Link>
                  </div>
                )}
                {decks.map(d => {
                  const legendaryCards = d.cards.filter(c => c.card.rarity === 'Légendaire');
                  const cardCount = d.cards.reduce((sum, c) => sum + c.qty, 0);
                  return (
                    <div
                      key={d.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => chooseDeck(d.id)}
                      onKeyDown={e => { if (e.key === 'Enter') chooseDeck(d.id) }}
                      onMouseEnter={() => setHoveredDeckId(d.id)}
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
