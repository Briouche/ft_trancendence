'use client'

import { useEffect, useState } from 'react'
import PageShell from '@/components/ui/PageShell'
import Panel from '@/components/ui/Panel'
import ProgressBar from '@/components/ui/ProgressBar'
import TierBadge from '@/components/ui/TierBadge'
import { TextLink } from '@/components/ui/TextButton'
import { useToast } from '@/components/ui/Toast'
import { ACHIEVEMENT_CARD_BACK_HINTS } from '@/lib/cardBacks'
import { ACHIEVEMENTS_BY_KEY, progressFraction, type AchievementStatus } from '@/lib/achievementCatalog'
import { ROUTES } from '@/config/routes'

/**
 * Achievements page. Fetching GET /api/achievements also unlocks anything reached since the last
 * visit; those are announced with a toast.
 */
export default function AchievementsView() {
    const [achievements, setAchievements] = useState<AchievementStatus[] | null>(null)
    const toast = useToast()

    useEffect(() => {
        fetch('/api/achievements')
            .then(res => res.ok ? res.json() : null)
            .then((data: { achievements: AchievementStatus[]; newlyUnlocked: string[] } | null) => {
                if (!data) return
                setAchievements(data.achievements)
                for (const key of data.newlyUnlocked) {
                    const a = ACHIEVEMENTS_BY_KEY.get(key)
                    if (a) toast(`🏆 Achievement unlocked: ${a.title} (+${a.rewardPacks} pack${a.rewardPacks > 1 ? 's' : ''})`, 'success')
                }
            })
    }, [toast])

    const unlocked = achievements?.filter(a => a.unlockedAt).length ?? 0

    return (
        <PageShell title="ACHIEVEMENTS">
            <Panel maxWidth="max-w-3xl" aria-labelledby="rules-title">
                <h2 id="rules-title" className="mb-2 font-display text-2xl text-ink-text">How it works</h2>
                <ul className="list-disc space-y-1 pl-5 font-serif text-sm text-ink-text">
                    <li>Each achievement has a goal. Reach it and the achievement unlocks for good.</li>
                    <li>Unlocking grants reward packs, added to your <a className="underline" href="/packs">unopened packs</a>.</li>
                    <li>Every unlocked achievement becomes a badge (bronze, silver or gold) on your public profile.</li>
                    <li>Wins also earn packs (Medium AI: 1, Hard AI: 2, vs player: 2), PvP matches move your Elo (K = 32) on the <a className="underline" href={ROUTES.players}>leaderboard</a>, and your first win in each mode unlocks a card back.</li>
                </ul>
                <p className="mt-3 font-serif text-sm text-ink-muted" aria-live="polite">
                    {achievements ? `${unlocked} / ${achievements.length} unlocked` : 'Loading…'}
                </p>
            </Panel>

            <Panel maxWidth="max-w-3xl" aria-labelledby="list-title">
                <h2 id="list-title" className="sr-only">Achievements</h2>
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {achievements?.map(a => {
                        const done = a.unlockedAt !== null
                        const shown = Math.min(a.value, a.goal)
                        return (
                            <li key={a.key} className={`travelbook-slot flex flex-col gap-2 p-3 ${done ? '' : 'opacity-90'}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <TierBadge tier={a.tier} title={a.title} locked={!done} />
                                    <span className="shrink-0 font-serif text-xs text-ink-muted">+{a.rewardPacks} pack{a.rewardPacks > 1 ? 's' : ''}</span>
                                </div>
                                <p className="font-serif text-sm text-ink-text">{a.description}</p>
                                <ProgressBar value={progressFraction(a, a.value)} complete={done} label={`${a.title}: ${shown} of ${a.goal}`} />
                                <p className="font-serif text-xs text-ink-muted" suppressHydrationWarning>
                                    {done ? `Unlocked ${new Date(a.unlockedAt!).toLocaleDateString()}` : `${shown} / ${a.goal}`}
                                </p>
                            </li>
                        )
                    })}
                </ul>
            </Panel>

            <Panel maxWidth="max-w-3xl" aria-labelledby="backs-title">
                <h2 id="backs-title" className="mb-2 font-display text-2xl text-ink-text">Card back rewards</h2>
                <ul className="list-disc space-y-1 pl-5 font-serif text-sm text-ink-text">
                    {Object.values(ACHIEVEMENT_CARD_BACK_HINTS).map(hint => <li key={hint}>{hint}</li>)}
                </ul>
                <div className="mt-3"><TextLink href="/collection" variant="secondary">See my card backs</TextLink></div>
            </Panel>
        </PageShell>
    )
}
