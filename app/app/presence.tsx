"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import type { PresenceStatus } from "@/components/profile/StatusIndicator";

type ActiveUser = { userId: number; username: string };

const PresenceContext = createContext<Set<number>>(new Set());
const ChatSocketContext = createContext<Socket | null>(null);

// Connects to the chat/presence socket.io server (socket-server/) and keeps the set of
// currently-online user ids up to date. Same origin via nginx's /chat-socket.io/ location (see
// proxy/dev.conf), so the session cookie rides along on the handshake for socket-server/auth.js —
// no manual credentials wiring needed. socket-server broadcasts "presence:update" to everyone on
// every connect/disconnect, including to the connecting client itself, so this also picks up the
// full current list right away instead of only future changes.
//
// This is the tab's only connection to socket-server: other features (ChatWindow) listen on it
// through useChatSocket() instead of opening their own, which would register the user as
// connected a second time in the presence set.
export function PresenceProvider({ children }: { children: ReactNode }) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  // Created once, lazily and client-side only (null during SSR — there's no window to connect
  // from); connecting is left to the effect so StrictMode's mount/unmount/mount just
  // disconnects and reconnects this same instance.
  const [socket] = useState(() =>
    typeof window === "undefined" ? null : io({ path: "/chat-socket.io/", autoConnect: false }),
  );

  useEffect(() => {
    if (!socket) return;

    const onPresence = (users: ActiveUser[]) => {
      setOnlineUserIds(new Set(users.map((u) => u.userId)));
    };
    socket.on("presence:update", onPresence);
    socket.connect();

    return () => {
      socket.off("presence:update", onPresence);
      socket.disconnect();
    };
  }, [socket]);

  return (
    <ChatSocketContext.Provider value={socket}>
      <PresenceContext.Provider value={onlineUserIds}>{children}</PresenceContext.Provider>
    </ChatSocketContext.Provider>
  );
}

// The tab's shared socket-server connection (see PresenceProvider). Null during SSR or outside
// the provider — callers attach their listeners in an effect and remove them on cleanup, never
// disconnect it themselves.
export function useChatSocket() {
  return useContext(ChatSocketContext);
}

export function useActiveUserIds() {
  return useContext(PresenceContext);
}

// Live status for any user: ONLINE/OFFLINE comes from the socket presence set above, not from
// User.status in the DB (never written for those two) — only IN_GAME is taken from the DB value.
// Use this everywhere a status dot is shown so every list agrees.
export function usePresenceStatus(user: { id: number; status: PresenceStatus }): PresenceStatus {
  const onlineUserIds = useActiveUserIds();
  if (user.status === "IN_GAME") return "IN_GAME";
  return onlineUserIds.has(user.id) ? "ONLINE" : "OFFLINE";
}
