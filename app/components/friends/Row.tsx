import { usePresenceStatus } from '@/app/presence'
import StatusIndicator, { type PresenceStatus } from '../profile/StatusIndicator'

export type FriendLike = {
    id: number
    username: string
    // Raw User.status from the DB — the displayed status is resolved live by usePresenceStatus.
    status: PresenceStatus
}

// Shared presentational primitive underlying FriendRow/RequestRow/SentRequestRow and AddFriend's
// search result — it takes the person as the API returns them (resolving their live presence
// status itself) and leaves context-specific action buttons to its callers. `action` is an
// optional trailing slot (accept/refuse, cancel, send request buttons) — it's wrapped so a click
// on it doesn't also trigger `onClick` (open that person's profile).
export default function Row({ person, action, onClick }: {
    person: FriendLike
    action?: React.ReactNode
    onClick?: () => void
}) {
    const status = usePresenceStatus(person)

    return (
        <div
            className={`travelbook-slot flex w-full items-center gap-3 bg-transparent px-3 py-2
                ${onClick ? 'cursor-pointer transition-colors hover:bg-ink-900/10' : ''}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={onClick ? (e => { if (e.key === 'Enter') onClick() }) : undefined}
        >
            <StatusIndicator status={status} />
            <span className="flex-1 truncate font-serif text-sm text-ink-text">{person.username}</span>
            {action && <div onClick={e => e.stopPropagation()}>{action}</div>}
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
