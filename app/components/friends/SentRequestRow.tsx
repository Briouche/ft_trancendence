import Row, { RowActionButton, type FriendLike } from './Row'

export type SentRequest = { friendshipId: number; addressee: FriendLike; createdAt: string }

export default function SentRequestRow({ request, onClick, onCancel, disabled }: {
    request: SentRequest
    onClick?: () => void
    onCancel: () => void
    disabled?: boolean
}) {
    return (
        <Row
            person={request.addressee}
            onClick={onClick}
            action={
                <RowActionButton
                    label="Cancel request"
                    tone="negative"
                    onClick={onCancel}
                    disabled={disabled}
                />
            }
        />
    )
}
