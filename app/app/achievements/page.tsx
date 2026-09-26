import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { ROUTES } from '@/config/routes'
import AchievementsView from './AchievementsView'

export const metadata: Metadata = { title: 'Achievements' }

/** /achievements — progress towards every achievement, with the rules and rewards. */
export default async function AchievementsPage() {
    const session = await getSession()
    if (!session) redirect(ROUTES.home)

    return <AchievementsView />
}
