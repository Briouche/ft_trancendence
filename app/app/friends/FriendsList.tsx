'use client'

import { useEffect, useState } from 'react'
import FriendRow, { type FriendLike } from './FriendRow'

export default function FriendsList() {
    const [friends, setFriends] = useState<FriendLike[] | null>(null)
    const [error, setError] = useState<string | null>(null)

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
    }, [])

    if (error) return <p className="text-center font-serif text-sm text-red-500">{error}</p>
    if (friends === null) return <p className="text-center font-serif text-sm text-ink-muted">Loading friends…</p>
    if (friends.length === 0) return <p className="text-center font-serif text-sm text-ink-muted">No friends yet.</p>

    return (
        <div className="flex w-full flex-col gap-2">
            {friends.map(friend => <FriendRow key={friend.id} person={friend} />)}
        </div>
    )
}
