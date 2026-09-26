import "server-only";

import prisma from "@/lib/prisma";
import { pushToUsers } from "@/lib/realtime";
import { CHAT_EVENTS, type ChatMessage } from "@/lib/chatEvents";

// Direct messages between friends. Only friends can talk (checked by the API routes), messages
// are saved first and then pushed in real time to both participants' open tabs.

export const CONVERSATION_PAGE_SIZE = 50;

type MessageRow = {
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  createdAt: Date;
  sender: { username: string };
};

const withSender = { sender: { select: { username: true } } } as const;

function toChatMessage(m: MessageRow): ChatMessage {
  return {
    id: m.id,
    senderId: m.senderId,
    senderName: m.sender.username,
    recipientId: m.recipientId,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  };
}

/**
 * Messages between two users, oldest first. `beforeId` pages backwards: pass the id of the oldest
 * message already shown to get the page before it.
 */
export async function getConversation(userId: number, otherId: number, beforeId?: number): Promise<ChatMessage[]> {
  const rows = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: otherId },
        { senderId: otherId, recipientId: userId },
      ],
      ...(beforeId ? { id: { lt: beforeId } } : {}),
    },
    orderBy: { id: "desc" },
    take: CONVERSATION_PAGE_SIZE,
    include: withSender,
  });
  return rows.reverse().map(toChatMessage);
}

/** Saves a message and pushes it to both participants (the sender's other tabs included). */
export async function sendMessage(senderId: number, recipientId: number, content: string): Promise<ChatMessage> {
  const row = await prisma.message.create({ data: { senderId, recipientId, content }, include: withSender });
  const message = toChatMessage(row);
  pushToUsers([senderId, recipientId], CHAT_EVENTS.message, message);
  return message;
}
