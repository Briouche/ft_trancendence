'use client'

import { useState, useTransition } from 'react'
import { searchUserByUsername, sendFriendRequest } from '@/lib/friends'
import FriendRow from './FriendRow'

export default function AddFriend({ onSent }: { onSent: () => void }) {
    const [query, setQuery] = useState('')
    const [result, setResult] = useState<Awaited<ReturnType<typeof searchUserByUsername>>>(null)
    const [notFound, setNotFound] = useState(false)
    const [isPending, startTransition] = useTransition()

    const [sendError, setSendError] = useState<string | null>(null)
    const [sent, setSent] = useState(false)
    const [isSending, startSending] = useTransition()

    function handleSearch() {
        if (!query.trim()) return
        setSendError(null)
        setSent(false)
        startTransition(async () => {
            const user = await searchUserByUsername(query)
            setResult(user)
            setNotFound(!user)
        })
    }

    function handleSend() {
        if (!result) return
        startSending(async () => {
            const response = await sendFriendRequest(result.id)
            if (response.error) {
                setSendError(response.error)
            } else {
                setSent(true)
                onSent()
            }
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
                    onChange={e => { setQuery(e.target.value); setResult(null); setNotFound(false); setSendError(null); setSent(false) }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
                    className="travelbook-slot w-full bg-transparent px-3 py-2 text-center font-serif
                        text-base text-ink-text placeholder:text-ink-muted/60 outline-none"
                />
            </label>

            {isPending && <p className="font-serif text-xs text-ink-muted">Searching…</p>}
            {!isPending && notFound && <p className="font-serif text-xs text-ink-muted">No user found.</p>}
            {!isPending && result && (
                <FriendRow
                    person={result}
                    action={
                        sent ? (
                            <span className="shrink-0 font-serif text-xs text-emerald-600">Sent</span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSend}
                                disabled={isSending}
                                className="shrink-0 rounded px-2 py-1 font-serif text-xs text-ink-muted
                                    transition-colors hover:bg-ink-900/10 disabled:opacity-30"
                            >
                                {isSending ? '…' : 'Send'}
                            </button>
                        )
                    }
                />
            )}
            {sendError && <p className="font-serif text-xs text-red-500">{sendError}</p>}
        </div>
    )
}
