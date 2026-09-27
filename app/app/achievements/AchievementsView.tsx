'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageShell from '@/components/ui/PageShell'
import Panel from '@/components/ui/Panel'
import ProgressBar from '@/components/ui/ProgressBar'
import { TextLink } from '@/components/ui/TextButton'
import CardBackArt from '@/components/CardBackArt'
import { DEFAULT_UNLOCKED_CARD_BACKS } from '@/lib/cardBacks'
import { ROUTES } from '@/config/routes'
import type { CardBackAchievement } from '@/lib/achievements'

/**
 * Achievements page: the unlockable card backs, each with its condition and the player's
 * progress, plus the other progression rules (reward packs, Elo, guaranteed legendary).
 */
export default function AchievementsView() {
    const [achievements, setAchievements] = useState<CardBackAchievement[] | null>(null)

    useEffect(() => {
        let cancelled = false
        fetch('/api/achievements')
            .then(res => res.ok ? res.json() : null)
            .then((data: { achievements: CardBackAchievement[] } | null) => {
                if (data && !cancelled) setAchievements(data.achievements)
            })
        return () => { cancelled = true }
    }, [])

    const unlocked = achievements?.filter(a => a.unlocked).length ?? 0

    return (
        <PageShell title="ACHIEVEMENTS">
            <Panel maxWidth="max-w-3xl" aria-labelledby="rules-title">
                <h2 id="rules-title" className="mb-2 font-display text-2xl text-ink-text">How it works</h2>
                <ul className="list-disc space-y-1 pl-5 font-serif text-sm text-ink-text">
                    <li>Each achievement unlocks a card back for good. Equip it from your <Link className="underline" href="/collection">collection</Link>; it is shown to your opponents during matches.</li>
                    <li>You start with {DEFAULT_UNLOCKED_CARD_BACKS.length} card backs.</li>
                    <li>Wins also earn packs (Medium AI: 1, Hard AI: 2, vs player: 2), and every 5th pack without a legendary guarantees one.</li>
                    <li>Matches against players move your Elo (K = 32), ranked on the <Link className="underline" href={ROUTES.players}>leaderboard</Link>.</li>
                </ul>
                <p className="mt-3 font-serif text-sm text-ink-muted" aria-live="polite">
                    {achievements ? `${unlocked} / ${achievements.length} unlocked` : 'Loading…'}
                </p>
            </Panel>

            <Panel maxWidth="max-w-3xl" aria-labelledby="list-title">
                <h2 id="list-title" className="sr-only">Card back achievements</h2>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {achievements?.map(a => (
                        <li key={a.cardBack} className="travelbook-slot flex gap-3 p-3">
                            <CardBackArt index={a.cardBack} className={`h-24 w-16 shrink-0 ${a.unlocked ? '' : 'opacity-40 grayscale'}`} />
                            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                                <p className="font-serif text-sm text-ink-text">{a.rule}</p>
                                <ProgressBar value={a.goal > 0 ? a.value / a.goal : 0} complete={a.unlocked} label={`${a.rule}: ${a.value} of ${a.goal}`} />
                                <p className="font-serif text-xs text-ink-muted">
                                    {a.unlocked ? '✅ Unlocked' : `${a.value} / ${a.goal}`}
                                </p>
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="mt-4"><TextLink href="/collection" variant="secondary">Equip a card back</TextLink></div>
            </Panel>
        </PageShell>
    )
}
