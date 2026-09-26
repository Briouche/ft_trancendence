// Names and payloads of the real-time events of the chat/presence socket (socket-server),
// shared by the server (lib/realtime.ts pushes them) and the browser
// (components/realtime/RealtimeProvider.tsx).

import type { Presence } from "@/lib/presenceTypes";

/** A chat message as sent to both participants. */
export type ChatMessage = {
  id: number;
  senderId: number;
  /** Username of the sender, for notifications. */
  senderName: string;
  recipientId: number;
  content: string;
  createdAt: string;
};

export const CHAT_EVENTS = {
  /** A new direct message; payload: ChatMessage. */
  message: "chat:message",
  /** Friendship state changed (request sent/accepted/declined, friend removed); no payload. */
  friendsChanged: "friends:changed",
  /** A watched user's presence changed; payload: { userId, presence }. */
  presence: "presence",
  /** Client → server: start receiving presence updates for these user ids. */
  watchPresence: "presence:watch",
  /** Client → server: stop receiving presence updates for these user ids. */
  unwatchPresence: "presence:unwatch",
} as const;

export type PresenceUpdate = { userId: number; presence: Presence };
