'use client'

import { useState, useTransition } from 'react'
import { searchUserByUsername } from '@/lib/friends'
import FriendRow from './FriendRow'

export default function AddFriend() {
    const [query, setQuery] = useState('')
    const [result, setResult] = useState<Awaited<ReturnType<typeof searchUserByUsername>>>(null)
    const [notFound, setNotFound] = useState(false)
    const [isPending, startTransition] = useTransition()

    function handleSearch() {
        if (!query.trim()) return
        startTransition(async () => {
            const user = await searchUserByUsername(query)
            setResult(user)
            setNotFound(!user)
        })
    }

    return (
        <div className="flex w-full flex-col items-center gap-2">
            <label className="flex w-full flex-col gap-1">
                <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Add a friend</span>
                <input
                    type="text"
                    placeholder="Enter a username"
                    value={query}
                    onChange={e => { setQuery(e.target.value); setResult(null); setNotFound(false) }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
                    className="travelbook-slot w-full bg-transparent px-3 py-2 text-center font-serif
                        text-base text-ink-text placeholder:text-ink-muted/60 outline-none"
                />
            </label>

            {isPending && <p className="font-serif text-xs text-ink-muted">Searching…</p>}
            {!isPending && notFound && <p className="font-serif text-xs text-ink-muted">No user found.</p>}
            {!isPending && result && <FriendRow person={result} />}
        </div>
    )
}
