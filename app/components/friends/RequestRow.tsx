import Row, { RowActionButton, type FriendLike } from './Row'

export type IncomingRequest = { friendshipId: number; requester: FriendLike; createdAt: string }

export default function RequestRow({ request, onClick, onAccept, onRefuse, disabled }: {
    request: IncomingRequest
    onClick?: () => void
    onAccept: () => void
    onRefuse: () => void
    disabled?: boolean
}) {
    return (
        <Row
            person={request.requester}
            onClick={onClick}
            action={
                <div className="flex shrink-0 items-center gap-1">
                    <RowActionButton label="Accept" tone="positive" onClick={onAccept} disabled={disabled} />
                    <RowActionButton label="Refuse" tone="negative" onClick={onRefuse} disabled={disabled} />
                </div>
            }
        />
    )
}
