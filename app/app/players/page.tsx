import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/cookieSession'
import { ROUTES } from '@/config/routes'
import PlayerSearch from './PlayerSearch'

export const metadata: Metadata = { title: 'Players & leaderboard' }

/** /players — player search and leaderboard (filters, sort, server-side pagination). */
export default async function PlayersPage() {
    const session = await getSession()
    if (!session) redirect(ROUTES.home)

    // PlayerSearch reads the query string (useSearchParams), which needs a Suspense boundary.
    return (
        <Suspense>
            <PlayerSearch me={session.userId} />
        </Suspense>
    )
}
