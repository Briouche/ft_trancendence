'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageShell from '@/components/ui/PageShell'
import Panel from '@/components/ui/Panel'
import Avatar from '@/components/ui/Avatar'
import PresenceDot from '@/components/ui/PresenceDot'
import CardBackArt from '@/components/CardBackArt'
import EmptyState from '@/components/ui/EmptyState'
import TextButton, { TextLink } from '@/components/ui/TextButton'
import { useToast } from '@/components/ui/Toast'
import { usePresence, useRealtimeEvent } from '@/components/realtime/RealtimeProvider'
import { CHAT_EVENTS } from '@/lib/chatEvents'
import { ROUTES } from '@/config/routes'
import type { PublicProfile } from '@/lib/profile'

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="travelbook-slot flex flex-col items-center px-3 py-2">
            <span className="font-display text-2xl text-ink-text">{value}</span>
            <span className="font-serif text-xs uppercase tracking-wider text-ink-muted">{label}</span>
        </div>
    )
}

/** Public profile: identity + presence, relationship actions, stats, earned card backs and recent matches. */
export default function PublicProfileView({ profile }: { profile: PublicProfile }) {
    const { user, stats, earnedCardBacks, matches, relationship } = profile
    const router = useRouter()
    const toast = useToast()
    const [busy, setBusy] = useState(false)
    const presence = usePresence([user.id], { [user.id]: user.presence })[user.id] ?? 'offline'

    // The page is server-rendered; re-render it when the friendship changes from either side.
    useRealtimeEvent(CHAT_EVENTS.friendsChanged, () => router.refresh())

    async function call(url: string, init: RequestInit, success: string) {
        setBusy(true)
        const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json' } })
        const body: { ok?: boolean; message?: string; error?: string } | null = await res.json().catch(() => null)
        setBusy(false)
        const succeeded = res.ok && body?.ok !== false
        toast(succeeded ? body?.message ?? success : body?.error ?? 'Something went wrong.', succeeded ? 'success' : 'info')
        router.refresh()
    }

    const actions = (() => {
        switch (relationship.kind) {
            case 'self':
                return <TextLink href={ROUTES.profile} variant="secondary">Edit my profile</TextLink>
            case 'friends':
                return <TextLink href={`${ROUTES.chat}/${encodeURIComponent(user.username)}`}>Chat</TextLink>
            case 'incoming':
                return <TextButton disabled={busy} onClick={() => call(`/api/friends/requests/${relationship.friendshipId}`, { method: 'PATCH', body: JSON.stringify({ action: 'accept' }) }, 'You are now friends.')}>Accept friend request</TextButton>
            case 'outgoing':
                return <span className="font-serif text-sm italic text-ink-muted">Friend request sent</span>
            default:
                return <TextButton disabled={busy} onClick={() => call('/api/friends/requests', { method: 'POST', body: JSON.stringify({ username: user.username }) }, 'Friend request sent.')}>Add friend</TextButton>
        }
    })()

    return (
        <PageShell title="PROFILE">
            <Panel maxWidth="max-w-3xl">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                    <Avatar src={user.avatarUrl} username={user.username} size="lg" />
                    <div className="flex flex-1 flex-col items-center gap-1 sm:items-start">
                        <h2 className="font-display text-3xl text-ink-text">{user.username}</h2>
                        <PresenceDot presence={presence} showLabel />
                        <p className="font-serif text-xs text-ink-muted" suppressHydrationWarning>
                            Joined {new Date(profile.joinedAt).toLocaleDateString()}
                        </p>
                    </div>
                    <div>{actions}</div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Elo" value={user.elo} />
                    <Stat label="Matches" value={stats.played} />
                    <Stat label="Wins" value={stats.wins} />
                    <Stat label="PvP wins" value={stats.pvpWins} />
                </div>
            </Panel>

            <Panel maxWidth="max-w-3xl" aria-labelledby="backs-title">
                <h2 id="backs-title" className="mb-3 font-display text-2xl text-ink-text">Card backs earned</h2>
                {earnedCardBacks.length === 0 ? <EmptyState>No achievement card back yet.</EmptyState> : (
                    <ul className="flex flex-wrap gap-3">
                        {earnedCardBacks.map(b => (
                            <li key={b.cardBack} className="flex w-24 flex-col items-center gap-1" title={b.rule}>
                                <CardBackArt index={b.cardBack} className="h-24 w-16" />
                                <span className="text-center font-serif text-[10px] leading-tight text-ink-muted">{b.rule}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </Panel>

            <Panel maxWidth="max-w-3xl" aria-labelledby="history-title">
                <h2 id="history-title" className="mb-3 font-display text-2xl text-ink-text">Recent matches</h2>
                {matches.length === 0 ? <EmptyState>No match played yet.</EmptyState> : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[28rem] font-serif text-sm text-ink-text">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wider text-ink-muted">
                                    <th scope="col" className="py-1">Date</th>
                                    <th scope="col">Mode</th>
                                    <th scope="col">Opponent</th>
                                    <th scope="col">Result</th>
                                    <th scope="col" className="text-right">Elo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matches.map(m => (
                                    <tr key={m.id} className="border-t border-ink-muted/20">
                                        <td className="py-1.5" suppressHydrationWarning>{new Date(m.date).toLocaleDateString()}</td>
                                        <td>{m.mode}</td>
                                        <td>{m.opponent ?? 'AI'}</td>
                                        <td className={m.won ? 'text-emerald-800' : 'text-red-800'}>
                                            {m.won ? 'Victory' : 'Defeat'}{m.endReason === 'forfeit' ? ' (forfeit)' : ''}
                                        </td>
                                        <td className="text-right">{m.eloChange === 0 ? '—' : `${m.eloChange > 0 ? '+' : ''}${m.eloChange}`}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
        </PageShell>
    )
}
