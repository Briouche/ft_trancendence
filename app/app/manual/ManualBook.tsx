"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import ScaleToFit from "@/components/ScaleToFit";
import {
  HomeButton, TitleBanner, NotebookScrollArea,
  woodenTableBackground, outlinedWhiteTextStyle,
} from "@/components/notebook/NotebookUI";
import { type CardFaceData } from "@/components/CardFace";
import ScaledCardFace from "@/components/ScaledCardFace";
import {
  CARD_NAME_BOX, CARD_COST_BOX, CARD_DESC_BOX, CARD_ATTACK_BOX, CARD_HEALTH_BOX,
} from "@/lib/cardLayout";
import PackArt from "@/app/packs/PackArt";

// Keyword glossary, mirroring EFFECT_LABELS in game/objects/card/CardPreview.ts.
const KEYWORDS: { label: string; desc: string }[] = [
  { label: "Taunt", desc: "You must attack this minion before others." },
  { label: "Rush", desc: "Can attack immediately, but not the enemy hero on its first turn." },
  { label: "Battlecry", desc: "Triggers on play." },
  { label: "Deathrattle", desc: "Triggers on death." },
  { label: "Cleave", desc: "Attacks also damage the target's neighbors." },
  { label: "Regeneration", desc: "Heals back to full health at the end of the turn." },
  { label: "Start of Turn", desc: "Triggers at the start of your turn." },
  { label: "End of Turn", desc: "Triggers at the end of your turn." },
  { label: "Archimed", desc: "Play all 6 to set up the ARCHI-exodia." },
];

const CARD_ANATOMY: { n: number; label: string; desc: string }[] = [
  { n: 1, label: "Name", desc: "top-left." },
  { n: 2, label: "Mana cost", desc: "on the gem, top-right." },
  { n: 3, label: "Card text", desc: "the box in the middle — keywords are shown in bold there." },
  { n: 4, label: "Attack", desc: "on the sword, bottom-left." },
  { n: 5, label: "Health", desc: "on the drop, bottom-right." },
];

// Legendaries with a passive effect (see prisma/seeds/data/tcg-collection.json).
const LEGENDARIES: { name: string; legendId: string; short: string; desc: string }[] = [
  { name: "Timmy, the planetsucker", legendId: "timmy", short: "Timmy", desc: "Can go above 20 HP — starts the game at 25." },
  { name: "Joël el Jeffe", legendId: "jeffe", short: "Jeffe", desc: "Wounded creatures get +1/0." },
  { name: "Freddy, le fossoyeur de tombe", legendId: "freddy", short: "Freddy", desc: "Every 4 minions that die, summons a 1/1 zombie." },
  { name: "Roi des rats", legendId: "roidesrats", short: "Roi des rats", desc: "Your end-of-turn effects trigger twice every 3rd turn." },
  { name: "Gertrude", legendId: "gertrude", short: "Gertrude", desc: "Every 4th spell cast returns to your hand; +1 spellpower." },
];

// Real cards (from tcg-collection.json) used as illustrations.
const EXAMPLE_CARD: CardFaceData = {
  id: "manual-example-golem",
  name: "Golem endormi",
  rarity: "Commune",
  cost: "2",
  atk: "2",
  def: "4",
  desc: "Taunt\nCannot attack",
  keywords: ["TAUNT"],
  legendId: "",
  assetKey: "golemEndormi",
  artist: "Brieuc",
};

const KEYWORD_EXAMPLE_CARD: CardFaceData = {
  id: "manual-example-thon",
  name: "le (gros) thon poli",
  rarity: "Commune",
  cost: "4",
  atk: "3",
  def: "5",
  desc: "Taunt\nBattlecry: restore 3 HP",
  keywords: ["TAUNT"],
  legendId: "",
  assetKey: "grosThon",
  artist: "Brieuc",
};

// Pixel-art icon, upscaled without smoothing.
function Icon({ src, className = "" }: { src: string; className?: string }) {
  return (
    <div
      className={`bg-contain bg-center bg-no-repeat ${className}`}
      style={{ backgroundImage: `url(${src})`, imageRendering: "pixelated" }}
    />
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-xs uppercase tracking-wide text-ink-muted">{children}</p>;
}

// Screenshot from public/gameAssets/tutorial/, cropped to the given aspect ratio.
function ScreenshotImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-sm border border-leather-800/50 ${className}`}>
      <Image src={src} alt={alt} fill unoptimized className="object-cover" />
    </div>
  );
}

// Numbered badge pinned at a %-position over an illustration.
function Callout({ x, y, n, size = "h-6 w-6 text-xs" }: { x: number; y: number; n: number; size?: string }) {
  return (
    <div
      className={`absolute z-20 flex ${size} -translate-x-1/2 -translate-y-1/2 items-center justify-center
        rounded-full border border-ink-900 bg-gold-300 font-display font-bold text-ink-900`}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {n}
    </div>
  );
}

const CARD_CALLOUTS: { x: number; y: number; n: number }[] = [
  { x: CARD_NAME_BOX.left, y: CARD_NAME_BOX.top, n: 1 },
  { x: CARD_COST_BOX.left, y: CARD_COST_BOX.top, n: 2 },
  { x: CARD_DESC_BOX.left, y: CARD_DESC_BOX.top, n: 3 },
  { x: CARD_ATTACK_BOX.left, y: CARD_ATTACK_BOX.top, n: 4 },
  { x: CARD_HEALTH_BOX.left, y: CARD_HEALTH_BOX.top, n: 5 },
];

// Callout positions on board-overview.png.
const BOARD_ANATOMY: { n: number; x: number; y: number; label: string; desc: string }[] = [
  { n: 1, x: 4, y: 48, label: "History", desc: "Icon log of recent actions — attacks, turns ended..." },
  { n: 2, x: 17, y: 62, label: "Deck", desc: "If you deck is empty you take damage when drawing (fatigue: 1, then 2, then 3...)." },
  { n: 3, x: 50, y: 50, label: "Board", desc: "Shared lanes for played minions, up to 6 per side." },
  { n: 4, x: 50, y: 90, label: "Hand", desc: "Up to 10 cards — a draw past that is lost." },
  { n: 5, x: 72, y: 88, label: "Hero", desc: "Health & board-count corner — a legendary's passive (if any) applies automatically." },
];

function ObjectiveShot() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <ScreenshotImage
        src="/gameAssets/tutorial/objective.png"
        alt="A hero's health tag and board-size counter"
        className="aspect-square w-full"
      />
      <Label>your hero&apos;s health, top corner of its zone</Label>
    </div>
  );
}

function BoardShot() {
  return (
    <div className="relative w-full">
      <ScreenshotImage
        src="/gameAssets/tutorial/board-overview.png"
        alt="A match in progress, annotated with its main elements"
        className="aspect-[1867/915] w-full"
      />
      {BOARD_ANATOMY.map(a => <Callout key={a.n} x={a.x} y={a.y} n={a.n} />)}
    </div>
  );
}

function ManaShot() {
  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex w-full flex-col items-center gap-1">
        <ScreenshotImage src="/gameAssets/tutorial/mana-empty.png" alt="An empty mana bar" className="aspect-[350/72] w-full" />
        <Label>no mana left this turn</Label>
      </div>
      <div className="flex w-full flex-col items-center gap-1">
        <ScreenshotImage src="/gameAssets/tutorial/mana-full.png" alt="A full mana bar" className="aspect-[320/60] w-full" />
        <Label>full mana, start of turn</Label>
      </div>
    </div>
  );
}

function AttackIntoTaunt() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex items-center gap-2">
        <Icon src="/gameAssets/attackSword.webp" className="h-11 w-11" />
        <span className="font-display text-lg text-ink-muted">→</span>
        <Icon src="/gameAssets/shield_taunt.webp" className="h-13 w-13" />
      </div>
      <Label>a Taunt minion must be attacked first</Label>
    </div>
  );
}

function CardWithCallouts({ card, caption }: { card: CardFaceData; caption: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative w-full">
        <ScaledCardFace card={card} />
        {CARD_CALLOUTS.map(c => <Callout key={c.n} x={c.x} y={c.y} n={c.n} size="h-8 w-8 text-base" />)}
      </div>
      <Label>{caption}</Label>
    </div>
  );
}

function LegendaryIcons() {
  return (
    <div className="grid grid-cols-3 gap-x-2 gap-y-2.5">
      {LEGENDARIES.map(l => (
        <div key={l.legendId} className="flex flex-col items-center gap-1">
          <Icon src={`/textures/collection/icon-leg-${l.legendId}.webp`} className="h-8 w-8" />
          <p className="text-center text-[9px] leading-tight text-ink-muted">{l.short}</p>
        </div>
      ))}
    </div>
  );
}

// Section with an image column beside the text (`reverse` swaps sides) or above it (`fullWidth`).
function IllustratedSection({ title, image, reverse, imgWidth = "w-44", fullWidth, children }: {
  title: string
  image: React.ReactNode
  reverse?: boolean
  imgWidth?: string
  fullWidth?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="mb-9">
      <p className="mb-2 font-display text-3xl font-bold text-white" style={outlinedWhiteTextStyle}>
        {title}
      </p>
      {fullWidth ? (
        <div className="flex flex-col gap-3">
          <div className="w-full">{image}</div>
          <div className="font-serif text-lg leading-relaxed text-ink-text">{children}</div>
        </div>
      ) : (
        <div className={`flex items-start gap-6 ${reverse ? "flex-row-reverse" : ""}`}>
          <div className={`flex ${imgWidth} shrink-0 flex-col items-center pt-1`}>{image}</div>
          <div className="flex-1 font-serif text-lg leading-relaxed text-ink-text">{children}</div>
        </div>
      )}
    </div>
  );
}

/** How-to-play notebook: rules, card anatomy, keywords and legendary passives, with illustrations. */
export default function ManualBook() {
  const router = useRouter();

  return (
    <div className="h-screen w-full overflow-hidden" style={woodenTableBackground}>
      <HomeButton onClick={() => router.push("/")} />

      <ScaleToFit className="h-screen pt-10" maxScale={1.3} align="start">
        <div className="flex flex-col items-center gap-4">
          <TitleBanner width="w-[700px]">TUTO</TitleBanner>

          <div className="travelbook-frame4-panel h-175 w-250 p-6">
            <NotebookScrollArea className="h-full pr-4">
              <IllustratedSection title="Objective" image={<ObjectiveShot />}>
                <p>
                  Reduce the enemy hero&apos;s health to 0 before yours does. Both start at 20 HP — the
                  match ends the instant either hits 0.
                </p>
              </IllustratedSection>

              <IllustratedSection title="The board" image={<BoardShot />} fullWidth>
                <div className="flex flex-col gap-1.5">
                  {BOARD_ANATOMY.map(a => (
                    <p key={a.n}>
                      <strong className="text-leather-900">{a.n}</strong> {a.label} — {a.desc}
                    </p>
                  ))}
                </div>
              </IllustratedSection>

              <IllustratedSection title="Mana" image={<ManaShot />}>
                <p>
                  +1 max mana every turn, up to 7, refilled each turn. Cards cost the mana shown on
                  their gem; unused mana doesn&apos;t carry over.
                </p>
              </IllustratedSection>

              <IllustratedSection title="Playing cards & attacking" image={<AttackIntoTaunt />} reverse>
                <p>
                  Drag a card from your hand to play it. A minion cannot attack the turn it is played, but can attack on later turns.
				  Minion lose health when attacked, and are destroyed when their health reaches 0.
				  You can chose wich minion or hero to attack.
                </p>
              </IllustratedSection>

              <IllustratedSection
                title="Reading a card"
                image={<CardWithCallouts card={EXAMPLE_CARD} caption="every zone on a card" />}
                imgWidth="w-84"
              >
                <div className="flex flex-col gap-1.5">
                  {CARD_ANATOMY.map(a => (
                    <p key={a.n}>
                      <strong className="text-leather-900">{a.n}</strong> {a.label} — {a.desc}
                    </p>
                  ))}
                  <p className="mt-1">
                    A spell card has no attack or health — its text box simply fills the extra space.
                  </p>
                </div>
              </IllustratedSection>

              <IllustratedSection
                title="Keywords"
                image={<ScaledCardFace card={KEYWORD_EXAMPLE_CARD} />}
                reverse
              >
                <div className="flex flex-col gap-1.5">
                  {KEYWORDS.map(k => (
                    <p key={k.label}>
                      <strong className="text-leather-900">{k.label}</strong> — {k.desc}
                    </p>
                  ))}
                </div>
              </IllustratedSection>

              <IllustratedSection title="Legendaries with a passive effect" image={<LegendaryIcons />}>
                <div className="flex flex-col gap-1.5">
                  {LEGENDARIES.map(l => (
                    <p key={l.legendId}>
                      <strong className="text-leather-900">{l.name}</strong> — {l.desc}
                    </p>
                  ))}
                </div>
              </IllustratedSection>

              <IllustratedSection
                title="Collection, packs & decks"
                image={<PackArt skin={{ col: 2, row: 5 }} width={110} />}
                reverse
              >
                <p>
                  Open packs (Librarian) to unlock cards, build a deck (Deck Builder), then play it
                  solo vs AI or against another player. Winning grants packs: 1 vs medium AI, 2 vs
                  hard AI, 2 vs a player. PvP wins also move your Elo rating.
                </p>
              </IllustratedSection>
            </NotebookScrollArea>
          </div>
        </div>
      </ScaleToFit>
    </div>
  );
}
