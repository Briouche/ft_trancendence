import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { areFriends } from '@/lib/friends'
import { getConversation } from '@/lib/messages'
import { avatarUrl } from '@/lib/avatar'
import { ROUTES } from '@/config/routes'
import ChatWindow from './ChatWindow'

type Props = { params: Promise<{ username: string }> }

/** Browser tab title: "Chat with <username>". */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    return { title: `Chat with ${decodeURIComponent((await params).username)}` }
}

/** /chat/:username — conversation with one friend (404 for anyone who isn't a friend). */
export default async function ConversationPage({ params }: Props) {
    const session = await getSession()
    if (!session) redirect(ROUTES.home)

    const username = decodeURIComponent((await params).username).toLowerCase()
    const peer = await prisma.user.findUnique({ where: { username }, select: { id: true, username: true, avatar: true } })
    if (!peer || peer.id === session.userId || !(await areFriends(session.userId, peer.id))) notFound()

    return (
        <ChatWindow
            me={session.userId}
            peer={{ id: peer.id, username: peer.username, avatarUrl: avatarUrl(peer.avatar) }}
            initialMessages={await getConversation(session.userId, peer.id)}
        />
    )
}
