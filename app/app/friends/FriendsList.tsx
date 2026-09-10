'use client'

import { useEffect, useState, useTransition } from 'react'
import { removeFriend } from '@/lib/friends'
import { outlinedWhiteTextStyle } from '@/components/notebook/NotebookUI'
import FriendRow, { RowActionButton, type FriendLike } from './FriendRow'

type Friend = FriendLike & { friendshipId: number }

// `refreshKey` bumps to refetch after a request is accepted elsewhere on the page — see
// FriendsRequestsList for the sync pattern.
export default function FriendsList({ refreshKey }: { refreshKey: number }) {
    const [friends, setFriends] = useState<Friend[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [pendingRemove, setPendingRemove] = useState<Friend | null>(null)
    const [isRemoving, startRemoving] = useTransition()

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
                            person={friend}
                            action={
                                <RowActionButton
                                    label="Remove friend"
                                    tone="negative"
                                    onClick={() => setPendingRemove(friend)}
                                />
                            }
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
                            <button
                                onClick={() => setPendingRemove(null)}
                                disabled={isRemoving}
                                className="travelbook-slot03a h-14 flex-1 font-display text-lg font-bold text-ink-text transition-transform active:scale-95 disabled:opacity-30"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmRemove}
                                disabled={isRemoving}
                                className="travelbook-slot03a h-14 flex-1 font-display text-lg font-bold text-white transition-transform active:scale-95 disabled:opacity-30"
                                style={outlinedWhiteTextStyle}
                            >
                                {isRemoving ? 'Removing…' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
