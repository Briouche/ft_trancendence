import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
<<<<<<< HEAD
import { getCurrentUser } from '@/lib/session'
import { avatarUrl } from '@/lib/avatar'
=======
import { getUserInfo } from '@/lib/user-and-friends/getUserInfo'
>>>>>>> origin/merge/readme-review-dev
import { ROUTES } from '@/config/routes'
import ProfileInformation from '@/components/profile/ProfileInformation'

<<<<<<< HEAD
export const metadata: Metadata = { title: 'My profile' }

// ?error=… / ?linked=1 set by the 42 OAuth callback when linking from this page.
const LINK_MESSAGES: Record<string, string> = {
    linked: '42 account linked. You can now sign in with 42.',
    oauth: 'Linking your 42 account failed. Please try again.',
    oauth_denied: 'Linking was cancelled on 42.',
    oauth_42_taken: 'This 42 account is already linked to another player.',
}

/** /profile — the signed-in user's own account: details, avatar, password, 42 link. */
export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; linked?: string }> }) {
    const user = await getCurrentUser()
=======
export default async function ProfilePage() {
    const user = await getUserInfo()
>>>>>>> origin/merge/readme-review-dev
    if (!user) redirect(ROUTES.home)

    const { error, linked } = await searchParams
    const notice = linked === '1' ? LINK_MESSAGES.linked : typeof error === 'string' ? LINK_MESSAGES[error] : undefined

    return <ProfileInformation user={user} avatar={avatarUrl(user.avatar)} notice={notice} />
}
