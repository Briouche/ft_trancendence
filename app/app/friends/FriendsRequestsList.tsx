'use client'

import { useEffect, useState, useTransition } from 'react'
import { respondToFriendRequest } from '@/lib/friends'
import FriendRow, { RowActionButton, type FriendLike } from './FriendRow'

type IncomingRequest = { friendshipId: number; requester: FriendLike; createdAt: string }

// Requests received (pending, addressed to the current user). `refreshKey` bumps to refetch
// after any mutation elsewhere in the Friends page (send/accept/refuse/cancel); `onChange` bumps
// it back up after this list's own accept/refuse so siblings (Friends, Requests sent) stay in sync.
export default function FriendsRequestsList({ refreshKey, onChange }: { refreshKey: number; onChange: () => void }) {
    const [requests, setRequests] = useState<IncomingRequest[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [pendingId, setPendingId] = useState<number | null>(null)
    const [isResponding, startResponding] = useTransition()

    useEffect(() => {
        let cancelled = false

        async function fetchRequests() {
            try {
                const res = await fetch('/api/friends/requests')
                if (!res.ok) throw new Error()
                const data = await res.json()
                if (!cancelled) setRequests(data.requests)
            } catch {
                if (!cancelled) setError('Could not load friend requests.')
            }
        }

        fetchRequests()
        return () => { cancelled = true }
    }, [refreshKey])

    function handleRespond(friendshipId: number, accept: boolean) {
        setPendingId(friendshipId)
        startResponding(async () => {
            const response = await respondToFriendRequest(friendshipId, accept)
            setPendingId(null)
            if (!response.error) onChange()
        })
    }

    if (error) return <p className="text-center font-serif text-sm text-red-500">{error}</p>
    if (requests === null) return <p className="text-center font-serif text-sm text-ink-muted">Loading requests…</p>
    if (requests.length === 0) return <p className="text-center font-serif text-sm text-ink-muted">No pending requests.</p>

    return (
        <div className="flex w-full flex-col gap-2">
            {requests.map(request => (
                <FriendRow
                    key={request.friendshipId}
                    person={request.requester}
                    action={
                        <div className="flex shrink-0 items-center gap-1">
                            <RowActionButton
                                label="Accept"
                                tone="positive"
                                disabled={isResponding && pendingId === request.friendshipId}
                                onClick={() => handleRespond(request.friendshipId, true)}
                            />
                            <RowActionButton
                                label="Refuse"
                                tone="negative"
                                disabled={isResponding && pendingId === request.friendshipId}
                                onClick={() => handleRespond(request.friendshipId, false)}
                            />
                        </div>
                    }
                />
            ))}
        </div>
    )
}
