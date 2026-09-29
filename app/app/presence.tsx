"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import type { PresenceStatus } from "@/components/profile/StatusIndicator";

type PresenceContextValue = {
  online: ReadonlySet<number>;
  watch: (userId: number) => () => void;
};

const PresenceContext = createContext<PresenceContextValue>({ online: new Set(), watch: () => () => {} });
const ChatSocketContext = createContext<Socket | null>(null);

// Several components can display the same user at once; ids are only unwatched when the last one
// unmounts. Changes are batched so a list of 30 friends sends one "presence:watch", not 30.
const WATCH_FLUSH_MS = 50;

/**
 * The tab's single connection to socket-server (chat + presence). Same origin through nginx's
 * /chat-socket.io/ location, so the session cookie rides along on the handshake.
 *
 * Presence is subscription based: components call usePresenceStatus(user), which registers that
 * id here; the provider sends the union of watched ids ("presence:watch") and socket-server only
 * pushes changes about those users ("presence"), instead of broadcasting every connection to
 * every client.
 *
 * Other features (ChatWindow) listen on this same socket through useChatSocket() rather than
 * opening their own, which would count the user as connected twice.
 */
export function PresenceProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState<ReadonlySet<number>>(new Set());
  // Created once, lazily and client-side only (socket null during SSR); connecting is left to
  // the effect so StrictMode's mount/unmount/mount just disconnects and reconnects this instance.
  const [{ socket, watch, flush, cancelFlush }] = useState(() => {
    const socket = typeof window === "undefined" ? null : io({ path: "/chat-socket.io/", autoConnect: false });
    const watchCounts = new Map<number, number>();
    let flushTimer: ReturnType<typeof setTimeout> | null = null;

    // Sends the current watch list; the answer says who among those users is online right now.
    const flush = () => {
      flushTimer = null;
      if (!socket?.connected) return; // the "connect" handler flushes once connected
      socket.emit("presence:watch", [...watchCounts.keys()], (answer: { online?: number[] }) => {
        if (answer?.online) setOnline(new Set(answer.online));
      });
    };
    const scheduleFlush = () => {
      if (flushTimer === null) flushTimer = setTimeout(flush, WATCH_FLUSH_MS);
    };
    const cancelFlush = () => {
      if (flushTimer !== null) clearTimeout(flushTimer);
      flushTimer = null;
    };
    const watch = (userId: number) => {
      watchCounts.set(userId, (watchCounts.get(userId) ?? 0) + 1);
      if (watchCounts.get(userId) === 1) scheduleFlush();
      return () => {
        const left = (watchCounts.get(userId) ?? 1) - 1;
        if (left > 0) watchCounts.set(userId, left);
        else {
          watchCounts.delete(userId);
          scheduleFlush();
        }
      };
    };
    return { socket, watch, flush, cancelFlush };
  });

  useEffect(() => {
    if (!socket) return;

    const onPresence = ({ userId, online: isOnline }: { userId: number; online: boolean }) => {
      setOnline((prev) => {
        if (prev.has(userId) === isOnline) return prev;
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };
    // Rooms don't survive a reconnection, so the watch list is sent again on every connect.
    const onConnect = () => flush();

    socket.on("presence", onPresence);
    socket.on("connect", onConnect);
    socket.connect();

    return () => {
      socket.off("presence", onPresence);
      socket.off("connect", onConnect);
      socket.disconnect();
      cancelFlush();
    };
  }, [socket, flush, cancelFlush]);

  return (
    <ChatSocketContext.Provider value={socket}>
      <PresenceContext.Provider value={{ online, watch }}>{children}</PresenceContext.Provider>
    </ChatSocketContext.Provider>
  );
}

/**
 * The tab's shared socket-server connection (see PresenceProvider). Null during SSR or outside
 * the provider — callers attach their listeners in an effect and remove them on cleanup, never
 * disconnect it themselves.
 */
export function useChatSocket(): Socket | null {
  return useContext(ChatSocketContext);
}

/**
 * Live status of one user, kept up to date while the calling component is mounted.
 * ONLINE/OFFLINE comes from socket-server; IN_GAME comes from the server-rendered `status`
 * (written by game_engine when a match starts and ends).
 */
export function usePresenceStatus(user: { id: number; status: PresenceStatus }): PresenceStatus {
  const { online, watch } = useContext(PresenceContext);
  useEffect(() => watch(user.id), [watch, user.id]);
  if (user.status === "IN_GAME") return "IN_GAME";
  return online.has(user.id) ? "ONLINE" : "OFFLINE";
}
