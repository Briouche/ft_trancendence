import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUserInfo } from '@/lib/user-and-friends/getUserInfo'
import { ROUTES } from '@/config/routes'
import ProfileInformation from '@/components/profile/ProfileInformation'

export const metadata: Metadata = { title: 'Profile' }

export default async function ProfilePage() {
    const user = await getUserInfo()
    if (!user) redirect(ROUTES.home)

    return <ProfileInformation user={user} />
}
