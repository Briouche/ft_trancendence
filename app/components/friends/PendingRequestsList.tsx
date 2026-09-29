'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelFriendRequest } from '@/lib/user-and-friends/friends'
import { ROUTES } from '@/config/routes'
import SentRequestRow, { type SentRequest } from './SentRequestRow'

// Requests the current user sent (pending, awaiting the addressee). See FriendsRequestsList for
// the refreshKey/onChange sync pattern.
export default function PendingRequestsList({ refreshKey, onChange }: { refreshKey: number; onChange: () => void }) {
    const [requests, setRequests] = useState<SentRequest[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [pendingId, setPendingId] = useState<number | null>(null)
    const [isCancelling, startCancelling] = useTransition()
    const router = useRouter()

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
            await cancelFriendRequest(friendshipId)
            setPendingId(null)
            // Refetch even on error: "not found" means the request changed under us (cancelled,
            // already answered), so this list is stale either way.
            onChange()
        })
    }

    if (error) return <p className="text-center font-serif text-sm text-red-500">{error}</p>
    if (requests === null) return <p className="text-center font-serif text-sm text-ink-muted">Loading pending requests…</p>
    if (requests.length === 0) return <p className="text-center font-serif text-sm text-ink-muted">No pending requests sent.</p>

    return (
        <div className="flex w-full flex-col gap-2">
            {requests.map(request => (
                <SentRequestRow
                    key={request.friendshipId}
                    request={request}
                    onClick={() => router.push(ROUTES.profileOf(request.addressee.username))}
                    disabled={isCancelling && pendingId === request.friendshipId}
                    onCancel={() => handleCancel(request.friendshipId)}
                />
            ))}
        </div>
    )
}
