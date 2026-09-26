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

// Frame per rarity; "Rare" is the spell frame (no attack/health slots).
const CARD_ART: Partial<Record<string, string>> = {
    'Commune': '/textures/cards/frame/frame-commune.webp',
    'Rare': '/textures/cards/frame/frame-rare.webp',
    'Épique': '/textures/cards/frame/frame-epique.webp',
    'Légendaire': '/textures/cards/frame/frame-legendaire.webp',
}

// Reference width the fixed font sizes below are tuned for; PX is one frame pixel at that width.
const NATURAL_WIDTH = 400
const CARD_SOURCE_PX = 130
const PX = NATURAL_WIDTH / CARD_SOURCE_PX
const ICON_NUMBER_FONT_SIZE = 23 * PX

// White digits with a 2px black outline, legible on any icon color.
const iconNumberStyle = {
    fontSize: ICON_NUMBER_FONT_SIZE,
    textShadow: [
        '-1px -1px 0 #000', '1px -1px 0 #000', '-1px 1px 0 #000', '1px 1px 0 #000',
        '-2px -2px 0 #000', '2px -2px 0 #000', '-2px 2px 0 #000', '2px 2px 0 #000',
        '-2px 0 0 #000', '2px 0 0 #000', '0 -2px 0 #000', '0 2px 0 #000',
    ].join(', '),
}

// "placeholder_card" is the DB default for cards without an illustration.
function hasCardArt(assetKey: string): boolean {
    return !!assetKey && assetKey !== 'placeholder_card'
}

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

function boxStyle(box: CardBox): CSSProperties {
    return { left: `${box.left}%`, top: `${box.top}%`, width: `${box.width}%`, height: `${box.height}%` }
}

/** DOM rendering of a card: frame, illustration, name, cost, text (keywords bolded), attack/health. */
export default function CardFace({ card, ownedQty }: { card: CardFaceData; ownedQty?: number }) {
    const art = CARD_ART[card.rarity] ?? CARD_ART['Commune']!
    const segments = splitKeywordSegments(card.desc, card.keywords)
    const isSpell = isSpellRarity(card.rarity)

    return (
            <div className="relative aspect-[130/191] w-full overflow-hidden shadow-lg">
                {ownedQty !== undefined && ownedQty > 1 && (
                    <span
                        className="absolute left-0 top-0 z-10 font-card font-bold text-white"
                        style={{ ...iconNumberStyle, fontSize: 13 * PX }}
                    >
                        x{ownedQty}
                    </span>
                )}

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

                <div
                    className="absolute inset-0"
                    style={{ backgroundImage: `url(${art})`, backgroundSize: '100% 100%', imageRendering: 'pixelated' }}
                />

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

                <div
                    className="absolute flex items-center justify-center"
                    style={boxStyle(isSpell ? CARD_COST_BOX_SPELL : CARD_COST_BOX)}
                >
                    <span className="font-card font-bold text-white" style={iconNumberStyle}>{card.cost}</span>
                </div>

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
                        <div
                            className="absolute flex items-center justify-center"
                            style={boxStyle(CARD_ATTACK_BOX)}
                        >
                            <span className="font-card font-bold text-white" style={iconNumberStyle}>{card.atk}</span>
                        </div>

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
