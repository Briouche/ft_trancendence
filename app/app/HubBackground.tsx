'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import SceneLoading from '@/components/library/SceneLoading'
import SimpleHubMenu from './SimpleHubMenu'
import type { WinsBreakdown, CardBacksSummary } from './AccountMenu'

const HubScene = dynamic(() => import('./HubScene'), { ssr: false, loading: SceneLoading })

const EMPTY_WINS: WinsBreakdown = { vsAiEasy: 0, vsAiMedium: 0, vsAiHard: 0, vsPlayer: 0 }
const EMPTY_CARD_BACKS: CardBacksSummary = { unlocked: 1, total: 1 }

// Some browsers report a WebGL1-capable GPU but can't create a WebGL2 context at all (GPU
// blocklisted, hardware acceleration off, no permission on the render device node, ...) — three.js
// then throws instead of the 3D hall ever mounting. Checked once via a throwaway canvas instead of
// letting <Canvas> fail: getContext('webgl2') returning null is the same signal, without the crash.
function supportsWebGL2(): boolean {
    try {
        const canvas = document.createElement('canvas')
        return !!canvas.getContext('webgl2')
    } catch {
        return false
    }
}

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
    const [stats, setStats] = useState({ cardCount: 0, elo: 1000, wins: EMPTY_WINS, cardBacks: EMPTY_CARD_BACKS })
    // null while unchecked (SSR / not yet mounted) — falls through to attempting HubScene, same
    // as before this check existed. Checked once on mount, not per-route: GPU capability doesn't
    // change while navigating.
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

    return (
        <div className={isHome ? '' : 'hidden'}>
            {webgl2Supported === false
                ? <SimpleHubMenu username={username} cardCount={stats.cardCount} elo={stats.elo} wins={stats.wins} cardBacks={stats.cardBacks} />
                : <HubScene username={username} cardCount={stats.cardCount} elo={stats.elo} wins={stats.wins} cardBacks={stats.cardBacks} active={isHome} />}
        </div>
    )
}
