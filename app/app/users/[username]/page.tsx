import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getPublicProfile } from '@/lib/profile'
import { ROUTES } from '@/config/routes'
import PublicProfileView from './PublicProfileView'

type Props = { params: Promise<{ username: string }> }

/** Browser tab title: "<username>'s profile". */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    return { title: `${decodeURIComponent((await params).username)}'s profile` }
}

/** /users/:username — public profile of any player (signed-in users only). */
export default async function PublicProfilePage({ params }: Props) {
    const session = await getSession()
    if (!session) redirect(ROUTES.home)

    const profile = await getPublicProfile(decodeURIComponent((await params).username), session.userId)
    if (!profile) notFound()

    return <PublicProfileView profile={profile} />
}
