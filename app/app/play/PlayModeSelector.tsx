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

// Bouton de choix (mode/difficulté) : reste allumé (SelectHighlight figé, animate=false) tant
// qu'il est le choix actif, pas seulement au survol — même principe que le dos de carte équipé
// dans CollectionBook (Slot, highlighted=vrai) et pas un simple hover.
function ToggleButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="travelbook-slot03a relative h-14 w-full font-display text-lg font-bold text-white
        transition-transform active:scale-95"
      style={outlinedWhiteTextStyle}
    >
      {(active || hovered) && <SelectHighlight className="-inset-1 z-10" animate={false} />}
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
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4 md:p-10" style={woodenTableBackground}>
      <HomeButton onClick={() => router.push("/")} />

      <ScaleToFit>
        <div className="flex flex-col items-center gap-4">
          <TitleBanner width="w-[900px]">JOUER</TitleBanner>

          <div className="flex h-[700px] items-stretch gap-6">
            {/* Gauche : mode + difficulté. Frame04a (comme le panneau de droite) plutôt que la
                texture de page du carnet (.travelbook-page) : ce n'est pas du contenu du livre à
                feuilleter, juste un panneau de choix — même distinction que celle déjà faite pour
                le panneau "My decks" dans DeckBuilder.tsx. */}
            <div className="travelbook-frame4-panel flex h-[700px] w-[480px] flex-col p-6">
              <p className="mb-4 text-center font-display text-3xl font-bold text-white" style={outlinedWhiteTextStyle}>
                Mode de jeu
              </p>
              <div className="flex flex-col gap-3">
                <ToggleButton active={mode === "solo"} onClick={() => setMode("solo")}>Solo (vs IA)</ToggleButton>
                <ToggleButton active={mode === "multiplayer"} onClick={() => setMode("multiplayer")}>Multijoueur</ToggleButton>
              </div>

              {mode === "solo" && (
                <>
                  <p className="mb-3 mt-6 text-center font-display text-3xl font-bold text-white" style={outlinedWhiteTextStyle}>
                    Difficulté
                  </p>
                  <div className="flex flex-col gap-3">
                    <ToggleButton active={difficulty === "facile"} onClick={() => setDifficulty("facile")}>Facile</ToggleButton>
                    <ToggleButton active={difficulty === "moyen"} onClick={() => setDifficulty("moyen")}>Moyen</ToggleButton>
                    <ToggleButton active={difficulty === "difficile"} onClick={() => setDifficulty("difficile")}>Difficile</ToggleButton>
                  </div>
                </>
              )}

              <p className="mt-auto text-center font-serif text-xs text-white/70" style={outlinedWhiteTextStyle}>
                Choisis un deck à droite pour lancer la partie.
              </p>
            </div>

            {/* Droite : mêmes decks sauvegardés que DeckBuilder.tsx ("My decks"), sans "Create
                deck" ni suppression — cliquer un deck lance directement la partie avec le mode
                choisi à gauche. */}
            <div className="travelbook-frame4-panel flex h-[700px] w-96 flex-col p-5">
              <p className="mb-3 text-center font-display text-4xl font-bold text-white" style={outlinedWhiteTextStyle}>
                My decks
              </p>

              <NotebookScrollArea className="-mr-6 flex-1">
                {decks.length === 0 && (
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <p className="text-center font-serif text-xs text-white/70" style={outlinedWhiteTextStyle}>
                      Tu n&apos;as pas encore de deck.
                    </p>
                    <Link
                      href="/deck/new"
                      className="travelbook-slot03a flex h-10 w-full items-center justify-center font-display font-bold text-white"
                      style={outlinedWhiteTextStyle}
                    >
                      Créer un deck
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
                              src={`/textures/collection/icon-leg-${c.card.legendId}.png`}
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
                      <span className="mr-4 shrink-0 font-serif text-xs text-ink-muted">{cardCount} cartes</span>
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
