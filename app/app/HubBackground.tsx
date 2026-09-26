'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import SceneLoading from '@/components/library/SceneLoading'
import SimpleHubMenu from './SimpleHubMenu'
import type { WinsBreakdown, CardBacksSummary } from './AccountMenu'
import { useToast } from '@/components/ui/Toast'

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

const noSubscription = () => () => {}

// Hub mounted once by the root layout and only hidden on other routes, so its WebGL scene is
// never rebuilt. Stats are refetched every time the user comes back to "/". Falls back to a
// plain menu without WebGL2.
export default function HubBackground({ username }: { username: string }) {
    const pathname = usePathname()
    const isHome = pathname === '/'
    const [stats, setStats] = useState({ cardCount: 0, elo: 1000, wins: EMPTY_WINS, cardBacks: EMPTY_CARD_BACKS })
    // null during server rendering (no DOM to probe), the real answer in the browser.
    const webgl2Supported = useSyncExternalStore<boolean | null>(noSubscription, supportsWebGL2, () => null)
    const toast = useToast()

    useEffect(() => {
        if (!isHome) return
        let cancelled = false

        fetch('/api/user/summary')
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (!data || cancelled) return
                setStats({ cardCount: data.cardCount, elo: data.elo, wins: data.wins, cardBacks: data.cardBacks })
                // Achievements reached since the last visit (typically during the match just played).
                for (const a of data.newAchievements as { title: string; rewardPacks: number }[]) {
                    toast(`🏆 Achievement unlocked: ${a.title} (+${a.rewardPacks} pack${a.rewardPacks > 1 ? 's' : ''})`, 'success')
                }
            })

        return () => { cancelled = true }
    }, [isHome, toast])

    return (
        <div className={isHome ? '' : 'hidden'}>
            {webgl2Supported === false
                ? <SimpleHubMenu username={username} cardCount={stats.cardCount} elo={stats.elo} wins={stats.wins} cardBacks={stats.cardBacks} />
                : <HubScene username={username} cardCount={stats.cardCount} elo={stats.elo} wins={stats.wins} cardBacks={stats.cardBacks} active={isHome} />}
        </div>
    )
}
