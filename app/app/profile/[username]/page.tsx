import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getUserInfo, getUserProfileByUsername } from '@/lib/user-and-friends/getUserInfo'
import { ROUTES } from '@/config/routes'
import ProfileInformation from '@/components/profile/ProfileInformation'

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
    return { title: `${(await params).username}'s profile` }
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
    // Usernames are stored lowercase (see registerUser/updateUserProfile), so /profile/Alice
    // should find "alice" rather than 404.
    const username = (await params).username.toLocaleLowerCase()

    const currentUser = await getUserInfo()
    if (!currentUser) redirect(ROUTES.home)

    // /profile/<my own username> is just /profile (editable) — send it there instead of showing
    // the read-only view of yourself.
    if (username === currentUser.username) redirect(ROUTES.profile)

    const user = await getUserProfileByUsername(username)
    if (!user) notFound()

    return <ProfileInformation user={user} readOnly />
}
