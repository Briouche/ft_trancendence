'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import SceneLoading from '@/components/home-library/SceneLoading'
import SimpleHubMenu from './SimpleHubMenu'
import type { WinsBreakdown, CardBacksSummary } from '@/components/account-menu/AccountMenu'

const HubScene = dynamic(() => import('./HubScene'), { ssr: false, loading: SceneLoading })

const EMPTY_WINS: WinsBreakdown = { vsAiEasy: 0, vsAiMedium: 0, vsAiHard: 0, vsPlayer: 0 }
const EMPTY_CARD_BACKS: CardBacksSummary = { unlocked: 1, total: 1 }

function supportsWebGL2(): boolean {
    try {
        const canvas = document.createElement('canvas')
        return !!canvas.getContext('webgl2')
    } catch {
        return false
    }
}

// Hub mounted once by the root layout and only hidden on other routes, so its WebGL scene is
// not rebuilt, except after a match (see `inGame`). Stats are refetched every time the user
// comes back to "/". Falls back to a plain menu without WebGL2.
export default function HubBackground({ username }: { username: string }) {
    const pathname = usePathname()
    const isHome = pathname === '/'
    // During a match the hub is unmounted (not just hidden) so its WebGL context and textures are
    // freed for Phaser; it rebuilds when the player comes back.
    const inGame = pathname.startsWith('/play/game')
    const [stats, setStats] = useState({ cardCount: 0, elo: 1000, wins: EMPTY_WINS, cardBacks: EMPTY_CARD_BACKS })
    const [webgl2Supported, setWebgl2Supported] = useState<boolean | null>(null)

    useEffect(() => {
        setWebgl2Supported(supportsWebGL2())
    }, [])

    useEffect(() => {
        if (!isHome) return
        let cancelled = false

        fetch('/api/user/summary')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data && !cancelled) setStats({ cardCount: data.cardCount, elo: data.elo, wins: data.wins, cardBacks: data.cardBacks }) })

        return () => { cancelled = true }
    }, [isHome])

    if (inGame) return null

    return (
        <div className={isHome ? '' : 'hidden'}>
            {webgl2Supported === false
                ? <SimpleHubMenu username={username} cardCount={stats.cardCount} elo={stats.elo} wins={stats.wins} cardBacks={stats.cardBacks} />
                : <HubScene username={username} cardCount={stats.cardCount} elo={stats.elo} wins={stats.wins} cardBacks={stats.cardBacks} active={isHome} />}
        </div>
    )
}
