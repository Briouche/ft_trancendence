'use client'

import { useEffect, useState } from 'react'
import FriendRow, { type FriendLike } from './FriendRow'

type SentRequest = { friendshipId: number; addressee: FriendLike; createdAt: string }

// Friend requests the current user sent and that are still pending.
export default function PendingRequestsList() {
    const [requests, setRequests] = useState<SentRequest[] | null>(null)
    const [error, setError] = useState<string | null>(null)

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
    }, [])

    if (error) return <p className="text-center font-serif text-sm text-red-500">{error}</p>
    if (requests === null) return <p className="text-center font-serif text-sm text-ink-muted">Loading pending requests…</p>
    if (requests.length === 0) return <p className="text-center font-serif text-sm text-ink-muted">No pending requests sent.</p>

    return (
        <div className="flex w-full flex-col gap-2">
            {requests.map(request => <FriendRow key={request.friendshipId} person={request.addressee} />)}
        </div>
    )
}
