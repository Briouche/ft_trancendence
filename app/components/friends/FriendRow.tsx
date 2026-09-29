import Row, { RowActionButton, type FriendLike } from './Row'

export type Friend = FriendLike & { friendshipId: number }

export default function FriendRow({ friend, onClick, onChat, onRemove, disabled }: {
    friend: Friend
    onClick?: () => void
    onChat: () => void
    onRemove: () => void
    disabled?: boolean
}) {
    return (
        <Row
            person={friend}
            onClick={onClick}
            action={
                <div className="flex shrink-0 items-center gap-1">
                    <button
                        type="button"
                        onClick={onChat}
                        className="shrink-0 rounded px-2 py-1 font-serif text-xs text-ink-muted
                            transition-colors hover:bg-ink-900/10"
                    >
                        Chat
                    </button>
                    <RowActionButton
                        label="Remove friend"
                        tone="negative"
                        onClick={onRemove}
                        disabled={disabled}
                    />
                </div>
            }
        />
    )
}
