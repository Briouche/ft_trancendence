import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import { ROUTES } from '@/config/routes'
import ProfileInformation from './ProfileInformation'

export default async function ProfilePage() {
    const user = await getCurrentUser()
    if (!user) redirect(ROUTES.home)

    return <ProfileInformation user={user} />
}
