import "server-only";

import { io } from "@/lib/redis";

// Server → browser pushes, delivered by socket-server to the room of each user (`user:<id>`,
// joined by every connection of that user). Event names are listed in lib/chatEvents.ts, shared
// with the client.

/**
 * Emits `event` to every open connection of the given users. Best effort: a Redis failure is
 * logged and swallowed, since the data is already saved and clients refetch on reconnect.
 */
export function pushToUsers(userIds: number[], event: string, payload: unknown): void {
  if (userIds.length === 0) return;
  try {
    io.to(userIds.map((id) => `user:${id}`)).emit(event, payload);
  } catch (err) {
    console.error(`pushToUsers(${event}) failed:`, err);
  }
}
