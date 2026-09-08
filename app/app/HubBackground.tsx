'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import SceneLoading from '@/components/library/SceneLoading'
import type { WinsBreakdown, CardBacksSummary } from './AccountMenu'

const HubScene = dynamic(() => import('./HubScene'), { ssr: false, loading: SceneLoading })

const EMPTY_WINS: WinsBreakdown = { vsAiEasy: 0, vsAiMedium: 0, vsAiHard: 0, vsPlayer: 0 }
const EMPTY_CARD_BACKS: CardBacksSummary = { unlocked: 1, total: 1 }

// Mounted once in the root layout, never unmounted between pages (see layout.tsx): rebuilding
// the three-fiber Canvas from scratch (WebGL context, shaders, procedural bookshelf geometry)
// on every return to "/" is what causes a visible freeze. `hidden` hides the scene on other
// routes without tearing down its WebGL context, unlike a React unmount.
//
// cardCount/wins come from a client fetch re-run on every return to "/" (rather than HomePage's
// server props, which only run once) so they reflect actions taken elsewhere — opening a pack,
// winning a match — without needing to recreate this component.
export default function HubBackground({ username }: { username: string }) {
    const pathname = usePathname()
    const isHome = pathname === '/'
    const [stats, setStats] = useState({ cardCount: 0, wins: EMPTY_WINS, cardBacks: EMPTY_CARD_BACKS })

    useEffect(() => {
        if (!isHome) return
        let cancelled = false

        fetch('/api/user/summary')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data && !cancelled) setStats({ cardCount: data.cardCount, wins: data.wins, cardBacks: data.cardBacks }) })

        return () => { cancelled = true }
    }, [isHome])

    return (
        <div className={isHome ? '' : 'hidden'}>
            <HubScene username={username} cardCount={stats.cardCount} wins={stats.wins} cardBacks={stats.cardBacks} active={isHome} />
        </div>
    )
}
