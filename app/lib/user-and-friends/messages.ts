"use server";

import prisma from "@/lib/prisma";
import socketEmitter, { userRoom } from "@/lib/socketEmitter";
import { getUserInfo, areFriends } from "@/lib/user-and-friends/getUserInfo";
import { isValidId, MESSAGE_MAX_LENGTH } from "@/lib/user-and-friends/requirements";
import { rateLimit } from "@/lib/rateLimit";

const CHAT_MESSAGES_PER_USER = { max: 20, windowMs: 10_000 };

// "use server" files may only export async functions, so the message shape is inferred by
// callers via `Awaited<ReturnType<typeof getMessages>>` (see ChatWindow) rather than exported here.

// Called from the /chat/[id] server component to load history, and safe to call from a client
// component too (it's a "use server" file) if the page ever needs to refetch.
export async function getMessages(otherUserId: number) {
  const currentUser = await getUserInfo();
  if (!currentUser) return { error: "Unauthorized. Please log in again." };

  if (!isValidId(otherUserId)) return { error: "User not found." };

  if (!(await areFriends(otherUserId))) {
    return { error: "You can only message friends." };
  }

  const rows = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUser.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUser.id },
      ],
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, senderId: true, receiverId: true, content: true, createdAt: true },
  });

  const messages = rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  return { error: null, messages };
}

// Persists the message, then pushes it live to both participants' `user:<id>` rooms through the
// socket-server's redis adapter (see lib/socketEmitter.ts) — the sender's room too, so their
// other open tabs show what they just sent. The push happens here, after every
// check has passed, rather than being relayed by the sender's browser — so a client can't
// deliver a message that skips the friendship/length checks or was never stored.
export async function sendMessage(receiverId: number, content: string) {
  const currentUser = await getUserInfo();
  if (!currentUser) return { error: "Unauthorized. Please log in again." };

  if (!isValidId(receiverId)) return { error: "User not found." };
  if (typeof content !== "string") return { error: "Message can't be empty." };

  const trimmed = content.trim();
  if (!trimmed) return { error: "Message can't be empty." };
  if (trimmed.length > MESSAGE_MAX_LENGTH) {
    return { error: `Message must be at most ${MESSAGE_MAX_LENGTH} characters.` };
  }

  if (!(await areFriends(receiverId))) {
    return { error: "You can only message friends." };
  }

  // Flood guard: a person doesn't send more than 20 messages in 10 seconds.
  if (!rateLimit(`chat:user:${currentUser.id}`, CHAT_MESSAGES_PER_USER)) {
    return { error: "You're sending messages too fast. Please wait a moment." };
  }

  const row = await prisma.message.create({
    data: { senderId: currentUser.id, receiverId, content: trimmed },
    select: { id: true, senderId: true, receiverId: true, content: true, createdAt: true },
  });

  const message = { ...row, createdAt: row.createdAt.toISOString() };

  // Best-effort: the message is already stored, so a redis hiccup only costs the live update
  // (the recipient still sees it on their next load) — it shouldn't fail the send.
  try {
    socketEmitter.to([userRoom(receiverId), userRoom(currentUser.id)]).emit("chat:message", message);
  } catch (err) {
    console.error("sendMessage: live push failed", err);
  }

  return { error: null, message };
}
