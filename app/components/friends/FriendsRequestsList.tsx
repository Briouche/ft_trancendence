'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { respondToFriendRequest } from '@/lib/user-and-friends/friends'
import { ROUTES } from '@/config/routes'
import RequestRow, { type IncomingRequest } from './RequestRow'

// Requests received (pending, addressed to the current user). `refreshKey` bumps to refetch
// after any mutation elsewhere in the Friends page (send/accept/refuse/cancel); `onChange` bumps
// it back up after this list's own accept/refuse so siblings (Friends, Requests sent) stay in sync.
export default function FriendsRequestsList({ refreshKey, onChange }: { refreshKey: number; onChange: () => void }) {
    const [requests, setRequests] = useState<IncomingRequest[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [pendingId, setPendingId] = useState<number | null>(null)
    const [isResponding, startResponding] = useTransition()
    const router = useRouter()

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
            await respondToFriendRequest(friendshipId, accept)
            setPendingId(null)
            // Refetch even on error: "not found" means the request changed under us (cancelled,
            // already answered), so this list is stale either way.
            onChange()
        })
    }

    if (error) return <p className="text-center font-serif text-sm text-red-500">{error}</p>
    if (requests === null) return <p className="text-center font-serif text-sm text-ink-muted">Loading requests…</p>
    if (requests.length === 0) return <p className="text-center font-serif text-sm text-ink-muted">No pending requests.</p>

    return (
        <div className="flex w-full flex-col gap-2">
            {requests.map(request => (
                <RequestRow
                    key={request.friendshipId}
                    request={request}
                    onClick={() => router.push(ROUTES.profileOf(request.requester.username))}
                    disabled={isResponding && pendingId === request.friendshipId}
                    onAccept={() => handleRespond(request.friendshipId, true)}
                    onRefuse={() => handleRespond(request.friendshipId, false)}
                />
            ))}
        </div>
    )
}
