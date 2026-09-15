'use client'

import { useEffect, useState } from 'react'
import FriendRow, { type FriendLike } from './FriendRow'

type IncomingRequest = { friendshipId: number; requester: FriendLike; createdAt: string }

// Pending friend requests addressed to the current user.
export default function FriendsRequestsList() {
    const [requests, setRequests] = useState<IncomingRequest[] | null>(null)
    const [error, setError] = useState<string | null>(null)

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
    }, [])

    if (error) return <p className="text-center font-serif text-sm text-red-500">{error}</p>
    if (requests === null) return <p className="text-center font-serif text-sm text-ink-muted">Loading requests…</p>
    if (requests.length === 0) return <p className="text-center font-serif text-sm text-ink-muted">No pending requests.</p>

    return (
        <div className="flex w-full flex-col gap-2">
            {requests.map(request => <FriendRow key={request.friendshipId} person={request.requester} />)}
        </div>
    )
}
