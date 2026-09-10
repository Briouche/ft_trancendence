'use client'

import { useEffect, useState, useTransition } from 'react'
import { cancelFriendRequest } from '@/lib/friends'
import FriendRow, { RowActionButton, type FriendLike } from './FriendRow'

type SentRequest = { friendshipId: number; addressee: FriendLike; createdAt: string }

// Requests the current user sent (pending, awaiting the addressee). See FriendsRequestsList for
// the refreshKey/onChange sync pattern.
export default function PendingRequestsList({ refreshKey, onChange }: { refreshKey: number; onChange: () => void }) {
    const [requests, setRequests] = useState<SentRequest[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [pendingId, setPendingId] = useState<number | null>(null)
    const [isCancelling, startCancelling] = useTransition()

    useEffect(() => {
        let cancelled = false

        async function fetchRequests() {
            try {
                const res = await fetch('/api/friends/requests/sent')
                if (!res.ok) throw new Error()
                const data = await res.json()
                if (!cancelled) setRequests(data.requests)
            } catch {
                if (!cancelled) setError('Could not load pending requests.')
            }
        }

        fetchRequests()
        return () => { cancelled = true }
    }, [refreshKey])

    function handleCancel(friendshipId: number) {
        setPendingId(friendshipId)
        startCancelling(async () => {
            const response = await cancelFriendRequest(friendshipId)
            setPendingId(null)
            if (!response.error) onChange()
        })
    }

    if (error) return <p className="text-center font-serif text-sm text-red-500">{error}</p>
    if (requests === null) return <p className="text-center font-serif text-sm text-ink-muted">Loading pending requests…</p>
    if (requests.length === 0) return <p className="text-center font-serif text-sm text-ink-muted">No pending requests sent.</p>

    return (
        <div className="flex w-full flex-col gap-2">
            {requests.map(request => (
                <FriendRow
                    key={request.friendshipId}
                    person={request.addressee}
                    action={
                        <RowActionButton
                            label="Cancel request"
                            tone="negative"
                            disabled={isCancelling && pendingId === request.friendshipId}
                            onClick={() => handleCancel(request.friendshipId)}
                        />
                    }
                />
            ))}
        </div>
    )
}
