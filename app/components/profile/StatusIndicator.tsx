export type PresenceStatus = 'ONLINE' | 'OFFLINE' | 'IN_GAME'

const STATUS_DOT: Record<PresenceStatus, string> = {
    ONLINE: 'bg-emerald-500',
    IN_GAME: 'bg-amber-500',
    OFFLINE: 'bg-ink-muted/50',
}

const STATUS_LABEL: Record<PresenceStatus, string> = {
    ONLINE: 'Online',
    IN_GAME: 'In game',
    OFFLINE: 'Offline',
}

// Colored presence dot, with an optional text label — shared by Row (dot only, inline in
// the row) and ProfileInformation (dot + label, standalone).
export default function StatusIndicator({ status, label }: { status: PresenceStatus; label?: boolean }) {
    return (
        <span className="flex shrink-0 items-center gap-2">
            <span className={`-translate-y-px h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[status]}`} />
            {label && <span className="font-serif text-sm leading-none text-ink-muted">{STATUS_LABEL[status]}</span>}
        </span>
    )
}
