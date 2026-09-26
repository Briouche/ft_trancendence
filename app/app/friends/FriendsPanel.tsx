'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import PageShell from '@/components/ui/PageShell'
import Panel from '@/components/ui/Panel'
import Field from '@/components/ui/Field'
import TextButton, { TextLink } from '@/components/ui/TextButton'
import EmptyState from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { usePresence, useRealtimeEvent } from '@/components/realtime/RealtimeProvider'
import { CHAT_EVENTS } from '@/lib/chatEvents'
import { ROUTES } from '@/config/routes'
import { USERNAME_MAX_LENGTH, USERNAME_PATTERN, usernameSchema } from '@/lib/validation'
import UserRow, { type UserSummary } from './UserRow'

type Request = { friendshipId: number; user: UserSummary }
type Data = { friends: UserSummary[]; incoming: Request[]; outgoing: Request[] }

const EMPTY: Data = { friends: [], incoming: [], outgoing: [] }

/** Friends and pending requests of the current user, or null if a request failed. */
async function loadFriendsData(): Promise<Data | null> {
    const [friendsRes, requestsRes] = await Promise.all([fetch('/api/friends'), fetch('/api/friends/requests')])
    if (!friendsRes.ok || !requestsRes.ok) return null
    const { friends } = await friendsRes.json()
    const { incoming, outgoing } = await requestsRes.json()
    return { friends, incoming, outgoing }
}

/** Error message of a failed API call (`{ error }` body), or a generic one. */
async function errorOf(res: Response): Promise<string> {
    const body: { error?: string } | null = await res.json().catch(() => null)
    return body?.error ?? 'Something went wrong.'
}

/**
 * Friends page: add a friend by username, answer received requests, cancel sent ones, and the
 * friends list with live presence. Refreshes itself when a friendship changes in another tab or
 * on the other person's side (friends:changed pushed by the server).
 */
export default function FriendsPanel() {
    const [data, setData] = useState<Data>(EMPTY)
    const [loaded, setLoaded] = useState(false)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const toast = useToast()

    const refresh = useCallback(() => loadFriendsData().then(next => {
        if (!next) return
        setData(next)
        setLoaded(true)
    }), [])

    useEffect(() => {
        let cancelled = false
        loadFriendsData().then(next => {
            if (!next || cancelled) return
            setData(next)
            setLoaded(true)
        })
        return () => { cancelled = true }
    }, [])
    useRealtimeEvent(CHAT_EVENTS.friendsChanged, () => { void refresh() })

    const everyone = useMemo(
        () => [...data.friends, ...data.incoming.map(r => r.user), ...data.outgoing.map(r => r.user)],
        [data],
    )
    const initialPresence = useMemo(() => Object.fromEntries(everyone.map(u => [u.id, u.presence])), [everyone])
    const presence = usePresence(everyone.map(u => u.id), initialPresence)

    async function run(request: () => Promise<Response>, success?: string) {
        setBusy(true)
        setError('')
        try {
            const res = await request()
            if (!res.ok) setError(await errorOf(res))
            else if (success) toast(success, 'success')
            await refresh()
        } finally {
            setBusy(false)
        }
    }

    async function addFriend(formData: FormData) {
        const parsed = usernameSchema.safeParse(formData.get('username'))
        if (!parsed.success) {
            setError(parsed.error.issues[0].message)
            return
        }
        setBusy(true)
        setError('')
        const res = await fetch('/api/friends/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: parsed.data }),
        })
        const body: { ok?: boolean; message?: string; error?: string } | null = await res.json().catch(() => null)
        if (res.ok && body?.ok) toast(body.message ?? 'Done.', 'success')
        else setError(body?.error ?? 'Something went wrong.')
        await refresh()
        setBusy(false)
    }

    const json = (method: string, body?: unknown) => ({
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    })

    return (
        <PageShell title="FRIENDS">
            <Panel maxWidth="max-w-2xl">
                <h2 className="mb-3 font-display text-2xl text-ink-text">Add a friend</h2>
                <form action={addFriend} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <Field
                        label="Username"
                        name="username"
                        required
                        maxLength={USERNAME_MAX_LENGTH}
                        pattern={USERNAME_PATTERN}
                        placeholder="their_username"
                        autoComplete="off"
                        className="flex-1"
                    />
                    <TextButton type="submit" disabled={busy}>Send request</TextButton>
                </form>
                {error && <p role="alert" className="mt-2 font-serif text-sm text-red-700">{error}</p>}
                <p className="mt-2 font-serif text-xs text-ink-muted">
                    Don&apos;t know their exact name? <a className="underline" href={ROUTES.players}>Search players</a>.
                </p>
            </Panel>

            <Panel maxWidth="max-w-2xl" aria-labelledby="incoming-title">
                <h2 id="incoming-title" className="mb-3 font-display text-2xl text-ink-text">Requests received</h2>
                {data.incoming.length === 0 ? <EmptyState>No pending request.</EmptyState> : (
                    <ul className="flex flex-col gap-2">
                        {data.incoming.map(r => (
                            <UserRow key={r.friendshipId} user={r.user} presence={presence[r.user.id] ?? 'offline'} actions={<>
                                <TextButton disabled={busy} onClick={() => run(() => fetch(`/api/friends/requests/${r.friendshipId}`, json('PATCH', { action: 'accept' })), `You are now friends with ${r.user.username}.`)}>Accept</TextButton>
                                <TextButton variant="danger" disabled={busy} onClick={() => run(() => fetch(`/api/friends/requests/${r.friendshipId}`, json('PATCH', { action: 'decline' })))}>Decline</TextButton>
                            </>} />
                        ))}
                    </ul>
                )}
            </Panel>

            <Panel maxWidth="max-w-2xl" aria-labelledby="outgoing-title">
                <h2 id="outgoing-title" className="mb-3 font-display text-2xl text-ink-text">Requests sent</h2>
                {data.outgoing.length === 0 ? <EmptyState>No request waiting for an answer.</EmptyState> : (
                    <ul className="flex flex-col gap-2">
                        {data.outgoing.map(r => (
                            <UserRow key={r.friendshipId} user={r.user} presence={presence[r.user.id] ?? 'offline'} actions={
                                <TextButton variant="secondary" disabled={busy} onClick={() => run(() => fetch(`/api/friends/requests/${r.friendshipId}`, json('DELETE')))}>Cancel</TextButton>
                            } />
                        ))}
                    </ul>
                )}
            </Panel>

            <Panel maxWidth="max-w-2xl" aria-labelledby="friends-title">
                <h2 id="friends-title" className="mb-3 font-display text-2xl text-ink-text">
                    Friends {loaded && <span className="text-base text-ink-muted">({data.friends.length})</span>}
                </h2>
                {data.friends.length === 0 ? <EmptyState>{loaded ? 'No friends yet — send a request above.' : 'Loading…'}</EmptyState> : (
                    <ul className="flex flex-col gap-2">
                        {data.friends.map(f => (
                            <UserRow key={f.id} user={f} presence={presence[f.id] ?? 'offline'} actions={<>
                                <TextLink href={`${ROUTES.chat}/${encodeURIComponent(f.username)}`}>Chat</TextLink>
                                <TextButton variant="danger" disabled={busy} onClick={() => {
                                    if (window.confirm(`Remove ${f.username} from your friends?`))
                                        void run(() => fetch(`/api/friends/${f.id}`, json('DELETE')), `${f.username} removed.`)
                                }}>Remove</TextButton>
                            </>} />
                        ))}
                    </ul>
                )}
            </Panel>
        </PageShell>
    )
}
