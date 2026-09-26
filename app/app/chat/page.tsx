import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { listFriends } from '@/lib/friends'
import { ROUTES } from '@/config/routes'
import ChatFriendList from './ChatFriendList'

export const metadata: Metadata = { title: 'Chat' }

/** /chat — pick a friend to talk to. */
export default async function ChatPage() {
    const session = await getSession()
    if (!session) redirect(ROUTES.home)

    return <ChatFriendList friends={await listFriends(session.userId)} />
}
