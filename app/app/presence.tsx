"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { io } from "socket.io-client";

type ActiveUser = { userId: number; username: string };

const PresenceContext = createContext<Set<number>>(new Set());

// Connects to the chat/presence socket.io server (socket-server/) and keeps the set of
// currently-online user ids up to date. Same origin via nginx's /chat-socket.io/ location (see
// proxy/dev.conf), so the session cookie rides along on the handshake for socket-server/auth.js —
// no manual credentials wiring needed. socket-server broadcasts "presence:update" to everyone on
// every connect/disconnect, including to the connecting client itself, so this also picks up the
// full current list right away instead of only future changes.
export function PresenceProvider({ children }: { children: ReactNode }) {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const socket = io({ path: "/chat-socket.io/" });

    socket.on("presence:update", (users: ActiveUser[]) => {
      setOnlineUserIds(new Set(users.map((u) => u.userId)));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return <PresenceContext.Provider value={onlineUserIds}>{children}</PresenceContext.Provider>;
}

export function useActiveUserIds() {
  return useContext(PresenceContext);
}
