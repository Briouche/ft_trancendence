import type { CSSProperties } from 'react'
import { splitKeywordSegments } from '@/lib/keywords'
import {
    CARD_ART_BOX, CARD_ATTACK_BOX, CARD_COST_BOX, CARD_COST_BOX_SPELL, CARD_DESC_BOX, CARD_DESC_BOX_SPELL,
    CARD_HEALTH_BOX, CARD_NAME_BOX, CARD_NAME_BOX_SPELL, CardBox, isSpellRarity,
} from '@/lib/cardLayout'

export type CardFaceData = {
    id: string
    name: string
    rarity: string
    cost: string
    atk: string
    def: string
    desc: string
    keywords: string[]
    legendId: string
    assetKey: string
    artist: string | null
}

// "placeholder_card" (DB default, see prisma/schema.prisma) = no illustration drawn yet for this
// card — same sentinel value as hasCardArt() on the Phaser rendering side (CardAssetLoader.ts).
function hasCardArt(assetKey: string): boolean {
    return !!assetKey && assetKey !== 'placeholder_card'
}

// Hand-drawn frames (.ase sources in Documents/, exported to PNG via an in-house script — no
// license to credit, these are the project's own assets): Common, Epic and Legendary for
// creatures (same ATK/DEF zones), Rare for spells (every spell was reclassified to Rare rarity —
// so this tier is exclusively spells, hence its frame having no swords/blood drop, see
// SPELL_RARITIES below).
const CARD_ART: Partial<Record<string, string>> = {
    'Commune': '/textures/cards/frame/frame-commune.webp',
    'Rare': '/textures/cards/frame/frame-rare.webp',
    'Épique': '/textures/cards/frame/frame-epique.webp',
    'Légendaire': '/textures/cards/frame/frame-legendaire.webp',
}


// CardFace is always rendered (before any transform:scale() from ScaledCardFace/DeskRoom) at this
// reference width — so this is also the width at which the drawn frame (130px wide at the source,
// cf. frame-commune.webp/frame-legendaire.webp) is displayed internally.
const NATURAL_WIDTH = 400
const CARD_SOURCE_PX = 130
// On-screen size of ONE frame pixel, at this reference scale — anti-aliased text can't be
// "pixelated" the way an image can (no image-rendering:pixelated equivalent for text), but
// pinning every font size to an integer multiple of this value keeps the two grids
// proportionally aligned at any final display size (the transform:scale() that shrinks the card
// shrinks text and image together, in the same proportions).
const PX = NATURAL_WIDTH / CARD_SOURCE_PX

// The frame's zones are small and fixed-size (unlike the old design, which grew with the card) —
// text has to shrink in steps based on its length to stay inside its box instead of overflowing.
function nameFontSize(name: string) {
    if (name.length > 22) return 8 * PX
    if (name.length > 16) return 10 * PX
    return 11 * PX
}
function descFontSize(desc: string) {
    if (desc.length > 110) return 7 * PX
    if (desc.length > 90) return 8 * PX
    if (desc.length > 55) return 9 * PX
    return 11 * PX
}
const ICON_NUMBER_FONT_SIZE = 23 * PX

// Converts a CardBox (cardLayout.ts, shared with the in-game Phaser rendering) into an
// absolute/% CSS style, as used below for every text box.
function boxStyle(box: CardBox): CSSProperties {
    return { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }
}

// Numbers placed directly on top of the frame's icons: white with a crisp (not blurred) black
// outline, 2px thick (diagonals at both 1px AND 2px, plus the 4 sides at 2px) to stay legible
// regardless of the icon's color underneath — light or dark.
const iconNumberStyle = {
    fontSize: ICON_NUMBER_FONT_SIZE,
    textShadow: [
        '-1px -1px 0 #000', '1px -1px 0 #000', '-1px 1px 0 #000', '1px 1px 0 #000',
        '-2px -2px 0 #000', '2px -2px 0 #000', '-2px 2px 0 #000', '2px 2px 0 #000',
        '-2px 0 0 #000', '2px 0 0 #000', '0 -2px 0 #000', '0 2px 0 #000',
    ].join(', '),
}

export default function CardFace({ card, ownedQty }: { card: CardFaceData; ownedQty?: number }) {
    // CARD_ART covers the 4 real rarities (Commune/Rare/Épique/Légendaire) — the ?? Commune
    // fallback is just a safety net for a card with a misspelled rarity in the DB.
    const art = CARD_ART[card.rarity] ?? CARD_ART['Commune']!
    const segments = splitKeywordSegments(card.desc, card.keywords)
    const isSpell = isSpellRarity(card.rarity)

    return (
            // shadow-lg (box-shadow), not drop-shadow-lg (filter): this div gets shrunk by an
            // ancestor's transform:scale() (ScaledCardFace/DeskRoom), and Safari has a known bug
            // where a filter on a scaled element can clip the render instead of painting the
            // shadow. box-shadow isn't affected.
            <div className="relative aspect-[130/191] w-full overflow-hidden shadow-lg">
                {ownedQty !== undefined && ownedQty > 1 && (
                    // left-0/top-0 (no negative offset): CardFaceLayer (ScaledCardFace) wraps this
                    // render in an overflow-hidden container for scaling — a badge overflowing the
                    // edges would get clipped there.
                    <span
                        className="absolute left-0 top-0 z-10 font-card font-bold text-white"
                        style={{ ...iconNumberStyle, fontSize: 13 * PX }}
                    >
                        x{ownedQty}
                    </span>
                )}

                {/* Card illustration, inside the frame's actual cutout window (CARD_ART_BOX,
                    identical to the in-game Phaser rendering — see cardLayout.ts) — nothing for
                    cards that don't have a drawn illustration yet (default assetKey). Rendered
                    before the frame (so underneath it): the frame's artwork always masks whatever
                    overflows the cutout window. `cover` (not `contain`): each source's ratio
                    varies slightly (see cardTextLayout.ts on the Phaser side) — cover fills the
                    whole box at the cost of cropping the edges a bit, rather than leaving an
                    empty band. */}
                {hasCardArt(card.assetKey) && (
                    <div
                        className="absolute"
                        style={{
                            ...boxStyle(CARD_ART_BOX),
                            backgroundImage: `url(/textures/cards/images/${card.assetKey}.webp)`,
                            backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
                            imageRendering: 'pixelated',
                        }}
                    />
                )}

                {/* Drawn frame (border, gem, swords, blood drop — except the "spell" frame, which
                    has neither swords nor drop) — on top of the illustration, so its artwork
                    always masks whatever overflows the cutout window. The boxes below are
                    positioned in % on top of it, measured against this artwork. */}
                <div
                    className="absolute inset-0"
                    style={{ backgroundImage: `url(${art})`, backgroundSize: '100% 100%', imageRendering: 'pixelated' }}
                />

                {/* Name, in the white box top-left */}
                <div
                    className="absolute flex items-center justify-center overflow-hidden px-1"
                    style={boxStyle(isSpell ? CARD_NAME_BOX_SPELL : CARD_NAME_BOX)}
                >
                    <p
                        className="truncate text-center font-card text-ink-900"
                        style={{ fontSize: nameFontSize(card.name) }}
                    >
                        {card.name}
                    </p>
                </div>

                {/* Mana cost, centered on the gem top-right */}
                <div
                    className="absolute flex items-center justify-center"
                    style={boxStyle(isSpell ? CARD_COST_BOX_SPELL : CARD_COST_BOX)}
                >
                    <span className="font-card font-bold text-white" style={iconNumberStyle}>{card.cost}</span>
                </div>

                {/* Card text, in the white box at the bottom — keywords in bold. Taller on the
                    "spell" frame: it reclaims the space ATK/DEF would otherwise occupy. */}
                <div
                    className="absolute flex flex-col items-center justify-center overflow-hidden px-1.5 py-1"
                    style={boxStyle(isSpell ? CARD_DESC_BOX_SPELL : CARD_DESC_BOX)}
                >
                    <p
                        className="whitespace-pre-line text-center font-card leading-snug text-ink-800"
                        style={{ fontSize: descFontSize(card.desc) }}
                    >
                        {segments.map((seg, i) => seg.bold
                            ? <strong key={i} className="font-bold text-leather-900">{seg.text}</strong>
                            : <span key={i}>{seg.text}</span>
                        )}
                    </p>
                </div>

                {!isSpell && (
                    <>
                        {/* Attack, at the intersection of the two blades (not lower, on the black
                            guard — a number there would disappear completely) */}
                        <div
                            className="absolute flex items-center justify-center"
                            style={boxStyle(CARD_ATTACK_BOX)}
                        >
                            <span className="font-card font-bold text-white" style={iconNumberStyle}>{card.atk}</span>
                        </div>

                        {/* Health, centered on the blood drop bottom-right */}
                        <div
                            className="absolute flex items-center justify-center"
                            style={boxStyle(CARD_HEALTH_BOX)}
                        >
                            <span className="font-card font-bold text-white" style={iconNumberStyle}>{card.def}</span>
                        </div>
                    </>
                )}
            </div>
    )
}
