import { redirect } from 'next/navigation'
import { getUserInfo } from '@/lib/user-and-friends/getUserInfo'
import { ROUTES } from '@/config/routes'
import ProfileInformation from '@/components/profile/ProfileInformation'
import { OAUTH_LINK_MESSAGES, oauthMessage } from '@/lib/auth/oauthMessages'

/** /profile — the signed-in user's own, editable profile (?linked / ?error come from the 42 link flow). */
export default async function ProfilePage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string | string[]; linked?: string | string[] }>
}) {
    const user = await getUserInfo()
    if (!user) redirect(ROUTES.home)

    const notice = oauthMessage(OAUTH_LINK_MESSAGES, await searchParams)
    return <ProfileInformation user={user} notice={notice} />
}
