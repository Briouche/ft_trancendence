import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/cookieSession'
import { ROUTES } from '@/config/routes'
import FriendsInformation from './FriendsInformation'

export default async function FriendsPage() {
    const session = await getSession()
    if (!session) redirect(ROUTES.home)

    return <FriendsInformation username={session.username} />
}
