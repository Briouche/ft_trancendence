'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import SceneLoading from '@/components/home-library/SceneLoading'
import SimpleHubMenu from './SimpleHubMenu'
import type { WinsBreakdown, CardBacksSummary } from '@/components/account-menu/AccountMenu'

const HubScene = dynamic(() => import('./HubScene'), { ssr: false, loading: SceneLoading })

const EMPTY_WINS: WinsBreakdown = { vsAiEasy: 0, vsAiMedium: 0, vsAiHard: 0, vsPlayer: 0 }
const EMPTY_CARD_BACKS: CardBacksSummary = { unlocked: 1, total: 1 }

let webgl2Support: boolean | undefined

// Probed once per page load (creating a WebGL context is not free), then cached.
function supportsWebGL2(): boolean {
    if (webgl2Support === undefined) {
        try {
            webgl2Support = !!document.createElement('canvas').getContext('webgl2')
        } catch {
            webgl2Support = false
        }
    }
    return webgl2Support
}

<<<<<<< HEAD
const noSubscription = () => () => {}

// Below this width the 3D hall's floating labels overlap and can't be tapped reliably, so phones
// get the text menu instead (the same one used without WebGL2).
const NARROW_QUERY = '(max-width: 767px)'

function subscribeNarrow(onChange: () => void) {
    const query = window.matchMedia(NARROW_QUERY)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
}

/**
 * Hub mounted once by the root layout and only hidden on other routes, so its WebGL scene is
 * never rebuilt. Stats are refetched every time the user comes back to "/". Falls back to a
 * plain menu without WebGL2 and on phone-sized screens.
 */
=======
// Hub mounted once by the root layout and only hidden on other routes, so its WebGL scene is
// not rebuilt, except after a match (see `inGame`). Stats are refetched every time the user
// comes back to "/". Falls back to a plain menu without WebGL2.
>>>>>>> origin/merge/readme-review-dev
export default function HubBackground({ username }: { username: string }) {
    const pathname = usePathname()
    const isHome = pathname === '/'
    // During a match the hub is unmounted (not just hidden) so its WebGL context and textures are
    // freed for Phaser; it rebuilds when the player comes back.
    const inGame = pathname.startsWith('/play/game')
    const [stats, setStats] = useState({ cardCount: 0, elo: 1000, wins: EMPTY_WINS, cardBacks: EMPTY_CARD_BACKS })
    // null during server rendering (no DOM to probe), the real answer in the browser.
    const webgl2Supported = useSyncExternalStore<boolean | null>(noSubscription, supportsWebGL2, () => null)
    const isNarrow = useSyncExternalStore(subscribeNarrow, () => window.matchMedia(NARROW_QUERY).matches, () => false)

    useEffect(() => {
        if (!isHome) return
        let cancelled = false

        fetch('/api/user/summary')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && !cancelled) setStats({ cardCount: data.cardCount, elo: data.elo, wins: data.wins, cardBacks: data.cardBacks })
            })

        return () => { cancelled = true }
    }, [isHome])

    if (inGame) return null

    return (
        <div className={isHome ? '' : 'hidden'}>
            {webgl2Supported === false || isNarrow
                ? <SimpleHubMenu username={username} cardCount={stats.cardCount} elo={stats.elo} wins={stats.wins} cardBacks={stats.cardBacks} />
                : <HubScene username={username} cardCount={stats.cardCount} elo={stats.elo} wins={stats.wins} cardBacks={stats.cardBacks} active={isHome} />}
        </div>
    )
}
