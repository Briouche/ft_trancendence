'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { removeFriend } from '@/lib/user-and-friends/friends'
import { ROUTES } from '@/config/routes'
import BoxedButton from '@/components/notebook/BoxedButton'
import FriendRow, { type Friend } from './FriendRow'

// `refreshKey` bumps to refetch after a request is accepted elsewhere on the page — see
// FriendsRequestsList for the sync pattern.
export default function FriendsList({ refreshKey }: { refreshKey: number }) {
    const [friends, setFriends] = useState<Friend[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [pendingRemove, setPendingRemove] = useState<Friend | null>(null)
    const [isRemoving, startRemoving] = useTransition()
    const router = useRouter()

    useEffect(() => {
        let cancelled = false

        async function fetchFriends() {
            try {
                const res = await fetch('/api/friends')
                if (!res.ok) throw new Error()
                const data = await res.json()
                if (!cancelled) setFriends(data.friends)
            } catch {
                if (!cancelled) setError('Could not load friends.')
            }
        }

        fetchFriends()
        return () => { cancelled = true }
    }, [refreshKey])

    function handleConfirmRemove() {
        if (!pendingRemove) return
        const target = pendingRemove
        startRemoving(async () => {
            const response = await removeFriend(target.friendshipId)
            setPendingRemove(null)
            if (!response.error) {
                setFriends(current => current?.filter(f => f.friendshipId !== target.friendshipId) ?? current)
            }
        })
    }

    if (error) return <p className="text-center font-serif text-sm text-red-500">{error}</p>
    if (friends === null) return <p className="text-center font-serif text-sm text-ink-muted">Loading friends…</p>

    return (
        <>
            {friends.length === 0 ? (
                <p className="text-center font-serif text-sm text-ink-muted">No friends yet.</p>
            ) : (
                <div className="flex w-full flex-col gap-2">
                    {friends.map(friend => (
                        <FriendRow
                            key={friend.friendshipId}
                            friend={friend}
                            onClick={() => router.push(ROUTES.profileOf(friend.username))}
                            onChat={() => router.push(ROUTES.chatWith(friend.id))}
                            onRemove={() => setPendingRemove(friend)}
                        />
                    ))}
                </div>
            )}

            {pendingRemove && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 backdrop-blur-sm"
                    onClick={() => setPendingRemove(null)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="travelbook-deck-frame flex w-120 flex-col items-center gap-6 p-10"
                    >
                        <p className="text-center font-display text-3xl font-bold text-ink-text">
                            Remove friend?
                        </p>
                        <p className="text-center font-serif text-lg text-ink-muted">
                            “{pendingRemove.username}” will be removed from your friends.
                        </p>
                        <div className="flex w-full gap-4">
                            <BoxedButton onClick={() => setPendingRemove(null)} disabled={isRemoving} tone="ink" className="h-14 flex-1 text-lg">
                                Cancel
                            </BoxedButton>
                            <BoxedButton onClick={handleConfirmRemove} disabled={isRemoving} className="h-14 flex-1 text-lg">
                                {isRemoving ? 'Removing…' : 'Remove'}
                            </BoxedButton>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
