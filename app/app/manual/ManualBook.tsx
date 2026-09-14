"use client";

import { useRouter } from "next/navigation";
import ScaleToFit from "@/components/ScaleToFit";
import {
  HomeButton, TitleBanner, NotebookScrollArea,
  woodenTableBackground, outlinedWhiteTextStyle,
} from "@/components/notebook/NotebookUI";

// These are the real KEYWORD_LABELS (lib/keywords.ts) as shown bolded in card text — but only
// Taunt/Rush/Battlecry/Deathrattle/Lifesteal/Silence have an actual generic rule on the engine
// side (see gameEngine/srcs/cardImport/keywordEffects.ts). Soigné, Régénération and Aventurier
// are just highlighted words in specific cards' text, not standalone rules — described here
// without inventing one.
const KEYWORDS: { label: string; desc: string }[] = [
  { label: "Taunt", desc: "The enemy must attack this minion first if it's on the board." },
  { label: "Ruée (Rush)", desc: "Can attack minions (not the enemy hero) the same turn it's played." },
  { label: "Cri de guerre (Battlecry)", desc: "Its effect triggers immediately when you play the card." },
  { label: "Râle d'agonie (Deathrattle)", desc: "Its effect triggers when the minion dies." },
  { label: "Vol de vie (Lifesteal)", desc: "Damage it deals also heals your hero by the same amount." },
  { label: "Silence", desc: "Permanently removes a target's other keywords and effects." },
  { label: "Soigné, Régénération, Aventurier", desc: "Highlighted words tied to what that specific card's text says — read the card itself for the exact effect." },
];

const LEGENDARIES: { name: string; desc: string }[] = [
  { name: "Archimed la maudite", desc: "Wins the game once you've played all 6 \"Archimed card\" family members (Haku, Neo, Po, Reborn, Ribgy, Zurg)." },
  { name: "Freddy, le fossoyeur de tombe", desc: "Summons a 1/1 skeleton every 4 minions that die." },
  { name: "Roi des rats", desc: "Triggers your end-of-turn effects an extra time every 3 turns." },
  { name: "Gertrude", desc: "Every 4th spell you cast goes back to your hand instead of to the graveyard." },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="mb-2 font-display text-2xl font-bold text-white" style={outlinedWhiteTextStyle}>
        {title}
      </p>
      <div className="font-serif text-sm leading-relaxed text-ink-text">{children}</div>
    </div>
  );
}

export default function ManualBook() {
  const router = useRouter();

  return (
    // h-screen + overflow-hidden, no padding/centering here (see CollectionBook.tsx): ScaleToFit
    // below already handles it — padding on top of its own h-screen box would push the total past
    // 100vh and force a scroll.
    <div className="h-screen w-full overflow-hidden" style={woodenTableBackground}>
      <HomeButton onClick={() => router.push("/")} />

      {/* maxScale capped well below the Collection/Deck Builder book's unbounded scale-up (compact
          title + panel, not viewport-sized) — align="start" glues it to the top. */}
      <ScaleToFit className="h-screen pt-10" maxScale={1.3} align="start">
        <div className="flex flex-col items-center gap-4">
          <TitleBanner width="w-[700px]">TUTO</TitleBanner>

          <div className="travelbook-frame4-panel h-175 w-205 p-6">
            <NotebookScrollArea className="h-full pr-4">
              <Section title="Objective">
                <p>Reduce the enemy hero&apos;s health to 0 before yours reaches 0.</p>
              </Section>

              <Section title="The board">
                <p>
                  Your hand sits at the bottom of the screen, with your board and hero above it. The
                  opponent&apos;s hand (face down), board and hero mirror yours at the top. Your mana bar
                  sits bottom-left, your deck pile bottom-right — the opponent&apos;s deck sits at the top.
                  End your turn with the button on the right once you&apos;re done.
                </p>
              </Section>

              <Section title="Mana">
                <p>
                  You gain +1 maximum mana every turn (up to 7), refilled fully each turn. Playing a
                  card costs the mana shown on its gem — you can only play what you can afford.
                </p>
              </Section>

              <Section title="Playing cards & attacking">
                <p>
                  Drag a card from your hand onto the board to play it. A minion can attack once it&apos;s
                  been under your control since the start of your turn (unless it has Ruée) — click it,
                  then choose a target: an enemy minion or the enemy hero. If the enemy has a Taunt
                  minion on the board, you must attack it before anything else.
                </p>
              </Section>

              <Section title="Reading a card">
                <p>
                  Top-left: name. Top-right gem: mana cost. Bottom-left sword: attack. Bottom-right
                  drop: health. The white box in the middle is the card&apos;s text — keywords are shown in
                  bold there.
                </p>
              </Section>

              <Section title="Keywords">
                <div className="flex flex-col gap-1.5">
                  {KEYWORDS.map(k => (
                    <p key={k.label}>
                      <strong className="text-leather-900">{k.label}</strong> — {k.desc}
                    </p>
                  ))}
                </div>
              </Section>

              <Section title="Legendaries with a special ability">
                <div className="flex flex-col gap-1.5">
                  {LEGENDARIES.map(l => (
                    <p key={l.name}>
                      <strong className="text-leather-900">{l.name}</strong> — {l.desc}
                    </p>
                  ))}
                </div>
              </Section>

              <Section title="Collection, packs & decks">
                <p>
                  Open packs with the Librarian to unlock new cards for your collection. Build a deck
                  in the Deck Builder from the cards you own, then pick that deck in the Game room to
                  start a match — against another player, or solo against the AI.
                </p>
              </Section>
            </NotebookScrollArea>
          </div>
        </div>
      </ScaleToFit>
    </div>
  );
}
