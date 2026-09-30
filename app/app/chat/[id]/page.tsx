import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getUserInfo, getUserProfileById } from '@/lib/user-and-friends/getUserInfo'
import { getMessages } from '@/lib/user-and-friends/messages'
import { ROUTES } from '@/config/routes'
import ChatWindow from '@/components/chat/ChatWindow'

export const metadata: Metadata = { title: 'Chat' }

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const otherId = Number(id)
    if (!Number.isInteger(otherId)) notFound()

    const currentUser = await getUserInfo()
    if (!currentUser) redirect(ROUTES.home)

    // Chatting with yourself isn't a thing — send it back to Friends instead.
    if (otherId === currentUser.id) redirect(ROUTES.friends)

    const otherUser = await getUserProfileById(otherId)
    if (!otherUser) notFound()

    // getMessages also enforces the friendship requirement — not being friends looks like the
    // page doesn't exist, same as a bad id.
    const response = await getMessages(otherId)
    if (response.error !== null) notFound()

    return <ChatWindow currentUserId={currentUser.id} otherUser={otherUser} initialMessages={response.messages} />
}
