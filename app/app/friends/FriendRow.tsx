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

// One user line: presence dot + username.
export default function FriendRow({ person }: { person: FriendLike }) {
    return (
        <div className="travelbook-slot flex w-full items-center gap-3 bg-transparent px-3 py-2">
            <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[person.status]}`} />
            <span className="truncate font-serif text-sm text-ink-text">{person.username}</span>
        </div>
    )
}
