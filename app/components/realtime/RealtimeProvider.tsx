'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { io, type Socket } from 'socket.io-client'
import { CHAT_EVENTS, type ChatMessage, type PresenceUpdate } from '@/lib/chatEvents'
import type { Presence } from '@/lib/presenceTypes'
import { useToast } from '@/components/ui/Toast'

// One connection to the chat/presence server (socket-server, /chat-socket.io/) per signed-in
// tab, opened by the root layout. Being connected is what makes the user "online"; the socket
// then delivers chat messages, friend-list changes and presence updates of the users on screen.

type RealtimeContextValue = {
    socket: Socket | null
    /** Registers the user ids a component displays; returns an unregister function. */
    watch: (ids: number[]) => () => void
    presence: Record<number, Presence>
}

const RealtimeContext = createContext<RealtimeContextValue>({ socket: null, watch: () => () => {}, presence: {} })

/**
 * Opens the realtime socket for the signed-in user `userId` (mounted by app/layout.tsx, keyed by
 * user id so a different account gets a fresh socket).
 */
export function RealtimeProvider({ userId, children }: { userId: number; children: React.ReactNode }) {
    // Created once, not connected yet: the effect below connects it (and disconnects it on
    // unmount). null during server rendering, where there is no browser to connect from.
    const [socket] = useState<Socket | null>(() =>
        typeof window === 'undefined' ? null : io({ path: '/chat-socket.io/', withCredentials: true, autoConnect: false }))
    const [presence, setPresence] = useState<Record<number, Presence>>({})
    // Every mounted usePresence() registers its ids here; the socket watches their union
    // (socket-server replaces the watch list on each call, so one list per connection).
    const watchers = useRef(new Map<symbol, number[]>())
    const toast = useToast()
    const pathname = usePathname()
    const pathnameRef = useRef(pathname)
    useEffect(() => { pathnameRef.current = pathname }, [pathname])

    const syncWatchList = useCallback((s: Socket | null) => {
        if (!s?.connected) return
        const ids = [...new Set([...watchers.current.values()].flat())].slice(0, 200)
        s.emit(CHAT_EVENTS.watchPresence, ids, (reply: { presence?: Record<number, Presence> }) => {
            if (reply?.presence) setPresence(current => ({ ...current, ...reply.presence }))
        })
    }, [])

    useEffect(() => {
        const s = socket
        if (!s) return

        s.on('connect', () => syncWatchList(s))
        s.on(CHAT_EVENTS.presence, (update: PresenceUpdate) =>
            setPresence(current => ({ ...current, [update.userId]: update.presence })))
        // Message notification, unless the conversation is already open.
        s.on(CHAT_EVENTS.message, (message: ChatMessage) => {
            if (message.senderId === userId) return
            if (pathnameRef.current === `/chat/${message.senderName}`) return
            toast(`💬 New message from ${message.senderName}`)
        })

        s.connect()

        return () => {
            s.removeAllListeners()
            s.disconnect()
        }
    }, [socket, userId, syncWatchList, toast])

    const watch = useCallback((ids: number[]) => {
        const key = Symbol('watcher')
        watchers.current.set(key, ids)
        syncWatchList(socket)
        return () => {
            watchers.current.delete(key)
            syncWatchList(socket)
        }
    }, [socket, syncWatchList])

    const value = useMemo(() => ({ socket, watch, presence }), [socket, watch, presence])
    return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

/** Calls `handler` for every `event` received on the realtime socket while mounted. */
export function useRealtimeEvent<T>(event: string, handler: (payload: T) => void) {
    const { socket } = useContext(RealtimeContext)
    const handlerRef = useRef(handler)
    useEffect(() => { handlerRef.current = handler }, [handler])

    useEffect(() => {
        if (!socket) return
        const listener = (payload: T) => handlerRef.current(payload)
        socket.on(event, listener)
        return () => { socket.off(event, listener) }
    }, [socket, event])
}

/**
 * Live presence of the given users. `initial` (e.g. from the API response that listed them) is
 * used until the socket reports something newer.
 */
export function usePresence(ids: number[], initial: Record<number, Presence> = {}): Record<number, Presence> {
    const { watch, presence } = useContext(RealtimeContext)
    const key = ids.join(',')
    useEffect(() => {
        if (!key) return
        return watch(key.split(',').map(Number))
    }, [key, watch])
    return useMemo(() => ({ ...initial, ...presence }), [initial, presence])
}
