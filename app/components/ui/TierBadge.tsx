import type { BadgeTier } from '@/lib/achievementCatalog'

const TIER_STYLE: Record<BadgeTier, string> = {
    bronze: 'border-amber-700 bg-amber-800/80 text-amber-100',
    silver: 'border-slate-300 bg-slate-500/80 text-white',
    gold: 'border-yellow-300 bg-yellow-600/90 text-yellow-50',
}

const TIER_ICON: Record<BadgeTier, string> = { bronze: '🥉', silver: '🥈', gold: '🥇' }

/** Achievement badge: medal of the tier + title; `locked` greys it out. */
export default function TierBadge({ tier, title, locked = false }: { tier: BadgeTier; title: string; locked?: boolean }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-serif text-xs
                ${locked ? 'border-ink-muted/40 bg-ink-muted/20 text-ink-muted grayscale' : TIER_STYLE[tier]}`}
            title={`${tier} badge${locked ? ' (locked)' : ''}`}
        >
            <span aria-hidden="true">{TIER_ICON[tier]}</span>
            {title}
        </span>
    )
}
