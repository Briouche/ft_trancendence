'use client'

import { useMemo } from 'react'
import PageShell from '@/components/ui/PageShell'
import Panel from '@/components/ui/Panel'
import EmptyState from '@/components/ui/EmptyState'
import { TextLink } from '@/components/ui/TextButton'
import { usePresence } from '@/components/realtime/RealtimeProvider'
import { ROUTES } from '@/config/routes'
import UserRow, { type UserSummary } from '../friends/UserRow'

/** Friends to start a conversation with, online ones first. */
export default function ChatFriendList({ friends }: { friends: UserSummary[] }) {
    const initial = useMemo(() => Object.fromEntries(friends.map(f => [f.id, f.presence])), [friends])
    const presence = usePresence(friends.map(f => f.id), initial)
    const sorted = [...friends].sort((a, b) => Number(presence[b.id] !== 'offline') - Number(presence[a.id] !== 'offline'))

    return (
        <PageShell title="CHAT">
            <Panel maxWidth="max-w-2xl">
                <h2 className="mb-3 font-display text-2xl text-ink-text">Your friends</h2>
                {sorted.length === 0 ? (
                    <EmptyState>You can chat with your friends. <a className="underline" href={ROUTES.friends}>Add some first</a>.</EmptyState>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {sorted.map(f => (
                            <UserRow key={f.id} user={f} presence={presence[f.id] ?? 'offline'}
                                actions={<TextLink href={`${ROUTES.chat}/${encodeURIComponent(f.username)}`}>Open</TextLink>} />
                        ))}
                    </ul>
                )}
            </Panel>
        </PageShell>
    )
}
