import { splitKeywordSegments } from '@/lib/keywords'

export type CardFaceData = {
    id:       string
    name:     string
    rarity:   string
    cost:     string
    atk:      string
    def:      string
    desc:     string
    emoji:    string
    keywords: string[]
}

const RARITY_STYLE: Record<string, { border: string; glow: string }> = {
    'Commune':     { border: 'border-stone-400',  glow: '' },
    'Peu commune': { border: 'border-emerald-700', glow: '' },
    'Rare':        { border: 'border-sky-800',     glow: '' },
    'Épique':      { border: 'border-purple-800',  glow: '' },
    'Légendaire':  { border: 'border-gold-400',    glow: 'animate-legendary-glow' },
}

export default function CardFace({ card, ownedQty }: { card: CardFaceData; ownedQty?: number }) {
    const rarity    = RARITY_STYLE[card.rarity] ?? RARITY_STYLE['Commune']
    const segments  = splitKeywordSegments(card.desc, card.keywords)

    return (
        <div
            className={`relative flex aspect-[3/4] w-full flex-col rounded-lg border-[3px] ${rarity.border} ${rarity.glow}
                bg-parchment-100 shadow-lg shadow-black/50`}
        >
            {ownedQty !== undefined && ownedQty > 1 && (
                <span className="absolute left-1 top-1 z-10 rounded bg-ink-950/85 px-1.5 py-0.5 font-display text-[10px] font-bold text-parchment-100">
                    x{ownedQty}
                </span>
            )}

            {/* Coût en mana, directement sur la carte */}
            <span className="absolute right-1.5 top-1.5 z-10 font-display text-base font-black text-sky-800">
                {card.cost}◆
            </span>

            {/* Bannière du nom */}
            <div className="px-2 pr-8 pt-2 text-center">
                <h3 className="truncate font-display text-sm font-bold leading-tight text-ink-900">
                    {card.name}
                </h3>
                <p className="font-serif text-[11px] italic text-leather-700">{card.rarity}</p>
            </div>

            {/* Illustration (emoji en attendant de vrais artworks) */}
            <div className="mx-2 mt-1 flex flex-1 items-center justify-center rounded border border-leather-800/30 bg-parchment-200/70">
                <span className="text-5xl drop-shadow-sm">{card.emoji}</span>
            </div>

            {/* Description, mots-clés en gras dans le texte */}
            <div className="flex-1 overflow-y-auto px-2 py-1.5">
                <p className="whitespace-pre-line font-serif text-[13px] leading-snug text-ink-800">
                    {segments.map((seg, i) => seg.bold
                        ? <strong key={i} className="font-bold text-leather-900">{seg.text}</strong>
                        : <span key={i}>{seg.text}</span>
                    )}
                </p>
            </div>

            {/* ATK / DEF, directement sur la carte, pas de pastilles */}
            <div className="flex items-center justify-between border-t border-leather-800/25 px-2 py-1.5">
                <span className="font-display text-base font-black text-red-800">⚔ {card.atk}</span>
                <span className="font-display text-base font-black text-slate-700">🛡 {card.def}</span>
            </div>
        </div>
    )
}
