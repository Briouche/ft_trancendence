import { PRESENCE_LABEL, type Presence } from '@/lib/presenceTypes'

const DOT_COLOR: Record<Presence, string> = {
    online: 'bg-emerald-500',
    in_game: 'bg-amber-500',
    offline: 'bg-ink-muted/50',
}

/**
 * Presence indicator: a colored dot, plus the status as text (visible with `showLabel`, and
 * always present for screen readers so the state isn't conveyed by color alone).
 */
export default function PresenceDot({ presence, showLabel = false }: { presence: Presence; showLabel?: boolean }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT_COLOR[presence]}`} />
            <span className={showLabel ? 'font-serif text-xs text-ink-muted' : 'sr-only'}>{PRESENCE_LABEL[presence]}</span>
        </span>
    )
}
