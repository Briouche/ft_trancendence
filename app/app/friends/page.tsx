import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/cookieSession'
import { ROUTES } from '@/config/routes'
import FriendsInformation from '../../components/friends/FriendsInformation'

export const metadata: Metadata = { title: 'Friends' }

export default async function FriendsPage() {
    const session = await getSession()
    if (!session) redirect(ROUTES.home)

    return <FriendsInformation username={session.username} />
}
