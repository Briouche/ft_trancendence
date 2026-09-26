'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import PageShell from '@/components/ui/PageShell'
import Panel from '@/components/ui/Panel'
import Avatar from '@/components/ui/Avatar'
import PresenceDot from '@/components/ui/PresenceDot'
import TextButton from '@/components/ui/TextButton'
import EmptyState from '@/components/ui/EmptyState'
import { usePresence, useRealtimeEvent } from '@/components/realtime/RealtimeProvider'
import { CHAT_EVENTS, type ChatMessage } from '@/lib/chatEvents'
import { MESSAGE_MAX_LENGTH, messageContentSchema } from '@/lib/validation'
import { ROUTES } from '@/config/routes'

type Peer = { id: number; username: string; avatarUrl: string }

/**
 * One conversation. New messages arrive over the realtime socket (both ours from other tabs and
 * theirs); sending goes through POST /api/messages/:id, whose response is merged the same way,
 * so a message is never shown twice (deduplicated by id).
 */
export default function ChatWindow({ me, peer, initialMessages }: { me: number; peer: Peer; initialMessages: ChatMessage[] }) {
    const [messages, setMessages] = useState(initialMessages)
    const [draft, setDraft] = useState('')
    const [error, setError] = useState('')
    const [sending, setSending] = useState(false)
    const [hasOlder, setHasOlder] = useState(initialMessages.length >= 50)
    const bottomRef = useRef<HTMLDivElement>(null)
    const presence = usePresence([peer.id])[peer.id] ?? 'offline'

    function merge(incoming: ChatMessage[]) {
        setMessages(current => {
            const byId = new Map(current.map(m => [m.id, m]))
            for (const m of incoming) byId.set(m.id, m)
            return [...byId.values()].sort((a, b) => a.id - b.id)
        })
    }

    useRealtimeEvent<ChatMessage>(CHAT_EVENTS.message, message => {
        const inThisConversation =
            (message.senderId === peer.id && message.recipientId === me) ||
            (message.senderId === me && message.recipientId === peer.id)
        if (inThisConversation) merge([message])
    })

    // Follow the newest message.
    const lastId = messages.at(-1)?.id
    useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }) }, [lastId])

    async function send(event: React.FormEvent) {
        event.preventDefault()
        const parsed = messageContentSchema.safeParse(draft)
        if (!parsed.success) {
            setError(parsed.error.issues[0].message)
            return
        }
        setSending(true)
        setError('')
        const res = await fetch(`/api/messages/${peer.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: parsed.data }),
        })
        const body = await res.json().catch(() => null)
        setSending(false)
        if (!res.ok) {
            setError(body?.error ?? 'Message not sent.')
            return
        }
        merge([body.message])
        setDraft('')
    }

    async function loadOlder() {
        const oldest = messages[0]?.id
        if (!oldest) return
        const res = await fetch(`/api/messages/${peer.id}?before=${oldest}`)
        if (!res.ok) return
        const { messages: older } = await res.json() as { messages: ChatMessage[] }
        setHasOlder(older.length >= 50)
        merge(older)
    }

    return (
        <PageShell title="CHAT">
            <Panel maxWidth="max-w-2xl" className="flex flex-col gap-3">
                <header className="flex flex-wrap items-center gap-3 border-b border-ink-muted/30 pb-3">
                    <Avatar src={peer.avatarUrl} username={peer.username} />
                    <div className="flex min-w-0 flex-1 flex-col">
                        <Link href={ROUTES.user(peer.username)} className="truncate font-display text-xl text-ink-text hover:underline">{peer.username}</Link>
                        <PresenceDot presence={presence} showLabel />
                    </div>
                    <Link href={ROUTES.chat} className="ml-auto font-serif text-sm text-ink-muted underline">All conversations</Link>
                </header>

                <div className="flex h-[55vh] flex-col gap-2 overflow-y-auto pr-1" aria-live="polite" aria-label={`Conversation with ${peer.username}`}>
                    {hasOlder && (
                        <button type="button" onClick={loadOlder} className="self-center font-serif text-xs text-ink-muted underline">
                            Load older messages
                        </button>
                    )}
                    {messages.length === 0 && <EmptyState>No message yet. Say hello!</EmptyState>}
                    {messages.map(m => {
                        const mine = m.senderId === me
                        return (
                            <div key={m.id} className={`flex max-w-[85%] flex-col ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
                                <p className={`whitespace-pre-wrap break-words rounded-lg px-3 py-2 font-serif text-sm
                                    ${mine ? 'bg-leather-800 text-parchment-100' : 'bg-ink-muted/20 text-ink-text'}`}>
                                    {m.content}
                                </p>
                                {/* Formatted in the viewer's time zone: differs from the server render by design. */}
                                <time className="mt-0.5 font-serif text-[10px] text-ink-muted" dateTime={m.createdAt} suppressHydrationWarning>
                                    {new Date(m.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                </time>
                            </div>
                        )
                    })}
                    <div ref={bottomRef} />
                </div>

                <form onSubmit={send} className="flex flex-col gap-2 sm:flex-row">
                    <label className="sr-only" htmlFor="chat-draft">Message</label>
                    <input
                        id="chat-draft"
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        maxLength={MESSAGE_MAX_LENGTH}
                        placeholder={`Message ${peer.username}…`}
                        autoComplete="off"
                        className="travelbook-slot flex-1 bg-transparent px-3 py-2 font-serif text-base text-ink-text outline-none
                            placeholder:text-ink-muted/60 focus-visible:ring-2 focus-visible:ring-gold-400"
                    />
                    <TextButton type="submit" disabled={sending || draft.trim() === ''}>Send</TextButton>
                </form>
                {error && <p role="alert" className="font-serif text-sm text-red-700">{error}</p>}
            </Panel>
        </PageShell>
    )
}
