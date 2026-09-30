'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { sendMessage, type getMessages } from '@/lib/user-and-friends/messages'
import { useChatSocket, usePresenceStatus } from '@/app/presence'
import type { ProfileUser } from '@/lib/user-and-friends/getUserInfo'
import { MESSAGE_MAX_LENGTH } from '@/lib/user-and-friends/requirements'
import NotebookPageLayout from '@/components/notebook/PageLayout'
import BoxedButton from '@/components/notebook/BoxedButton'
import Avatar from '@/components/profile/Avatar'
import StatusIndicator from '@/components/profile/StatusIndicator'

type Message = Extract<Awaited<ReturnType<typeof getMessages>>, { error: null }>['messages'][number]

// Friend-gated 1:1 chat (see lib/user-and-friends/messages.ts) — history loads server-side in
// the page, new messages are persisted by the sendMessage server action, which also pushes them
// live to both participants' `user:<id>` rooms (see lib/socketEmitter.ts). This only listens, on
// the tab's shared socket (see PresenceProvider): it never emits messages itself, so everything it
// receives has passed the server-side checks.
export default function ChatWindow({ currentUserId, otherUser, initialMessages }: {
    currentUserId: number
    otherUser: ProfileUser
    initialMessages: Message[]
}) {
    const [messages, setMessages] = useState<Message[]>(initialMessages)
    const [draft, setDraft] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSending, startSending] = useTransition()
    const bottomRef = useRef<HTMLDivElement | null>(null)

    // The sending tab gets its own message twice — from sendMessage's response and from the live
    // push to its own room, in either order — so skip any id already shown.
    function addMessage(message: Message) {
        setMessages(current => current.some(m => m.id === message.id) ? current : [...current, message])
    }

    const status = usePresenceStatus(otherUser)
    const socket = useChatSocket()

    useEffect(() => {
        if (!socket) return

        // Every message to or from this user arrives here, from any conversation — keep only this
        // one: theirs to me, or mine to them (sent from this tab or another one of mine).
        const onMessage = (message: Message) => {
            const isThisConversation =
                (message.senderId === otherUser.id && message.receiverId === currentUserId) ||
                (message.senderId === currentUserId && message.receiverId === otherUser.id)
            if (isThisConversation) addMessage(message)
        }

        socket.on('chat:message', onMessage)
        return () => { socket.off('chat:message', onMessage) }
    }, [socket, otherUser.id, currentUserId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    function handleSend() {
        const content = draft.trim()
        if (!content || isSending) return
        setError(null)
        startSending(async () => {
            const response = await sendMessage(otherUser.id, content)
            if (response.error !== null) {
                setError(response.error)
                return
            }
            addMessage(response.message)
            setDraft('')
        })
    }

    return (
        <NotebookPageLayout title={otherUser.username.toUpperCase()} panelClassName="h-150 w-96">
            <div className="flex items-center justify-center gap-2">
                <Avatar src={otherUser.avatar} size={32} />
                <StatusIndicator status={status} label />
            </div>

            <div className="notebook-scroll-hidden mt-4 flex flex-1 flex-col gap-2 overflow-y-auto">
                {messages.length === 0 ? (
                    <p className="text-center font-serif text-sm text-ink-muted">No messages yet. Say hello!</p>
                ) : (
                    messages.map(message => (
                        <div
                            key={message.id}
                            className={`travelbook-slot max-w-[80%] break-words px-3 py-2 font-serif text-sm text-ink-text
                                ${message.senderId === currentUserId ? 'self-end bg-ink-900/10' : 'self-start bg-transparent'}`}
                        >
                            {message.content}
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {error && <p className="mt-2 text-center font-serif text-xs text-red-500">{error}</p>}

            <div className="mt-3 flex items-center gap-2">
                <input
                    type="text"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend() } }}
                    placeholder="Type a message…"
                    aria-label={`Message to ${otherUser.username}`}
                    maxLength={MESSAGE_MAX_LENGTH}
                    className="travelbook-slot w-full bg-transparent px-3 py-2 font-serif
                        text-sm text-ink-text placeholder:text-ink-muted/60 outline-none"
                />
                <BoxedButton onClick={handleSend} disabled={isSending || !draft.trim()} className="h-10 shrink-0 px-4 text-sm">
                    Send
                </BoxedButton>
            </div>
        </NotebookPageLayout>
    )
}
