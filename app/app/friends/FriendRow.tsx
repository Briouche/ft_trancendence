export type FriendLike = {
    id: number
    username: string
    avatar: string | null
    status: 'ONLINE' | 'OFFLINE' | 'IN_GAME'
}

const STATUS_DOT: Record<FriendLike['status'], string> = {
    ONLINE: 'bg-emerald-500',
    IN_GAME: 'bg-amber-500',
    OFFLINE: 'bg-ink-muted/50',
}

// Shared presentational row for FriendsList/FriendsRequestsList/PendingRequestsList — the three
// source components only differed in which field of the payload they read (friend/requester/
// addressee), so a single row takes the resolved person directly instead of being duplicated.
// `action` is an optional trailing slot (accept/refuse, cancel, send request buttons).
export default function FriendRow({ person, action }: { person: FriendLike; action?: React.ReactNode }) {
    return (
        <div className="travelbook-slot flex w-full items-center gap-3 bg-transparent px-3 py-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[person.status]}`} />
            <span className="flex-1 truncate font-serif text-sm text-ink-text">{person.username}</span>
            {action}
        </div>
    )
}

// Small ghost icon button shared by the accept/refuse/cancel actions below.
export function RowActionButton({ label, tone, onClick, disabled }: {
    label: string
    tone: 'positive' | 'negative'
    onClick: () => void
    disabled?: boolean
}) {
    const toneClass = tone === 'positive'
        ? 'text-emerald-600 hover:bg-emerald-600/10'
        : 'text-red-600 hover:bg-red-600/10'

    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            disabled={disabled}
            className={`shrink-0 rounded px-2 py-1 font-serif text-sm transition-colors disabled:opacity-30 ${toneClass}`}
        >
            {tone === 'positive' ? '✓' : '✕'}
        </button>
    )
}
