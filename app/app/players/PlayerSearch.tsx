'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import PageShell from '@/components/ui/PageShell'
import Panel from '@/components/ui/Panel'
import Avatar from '@/components/ui/Avatar'
import PresenceDot from '@/components/ui/PresenceDot'
import Pagination from '@/components/ui/Pagination'
import EmptyState from '@/components/ui/EmptyState'
import { useActiveUserIds } from '@/app/presence'
import type { Presence } from '@/lib/presenceTypes'
import { ROUTES } from '@/config/routes'
import { USER_PAGE_SIZES, userSearchSchema, type UserSearchParams } from '@/lib/validation'
import type { UserSearchResult } from '@/lib/userSearch'

const SORT_LABEL: Record<UserSearchParams['sort'], string> = {
    elo: 'Elo',
    pvpWins: 'PvP wins',
    username: 'Name',
    joined: 'Join date',
}

const FILTER_LABEL: Record<UserSearchParams['filter'], string> = {
    all: 'Everyone',
    online: 'Online now',
    friends: 'My friends',
}

const selectClass = `travelbook-slot min-h-10 bg-transparent px-2 font-serif text-sm text-ink-text outline-none
    focus-visible:ring-2 focus-visible:ring-gold-400`

/**
 * Player search / leaderboard. The state lives in the URL query string (shareable, survives a
 * reload, back button works); every change fetches one page from GET /api/users, which filters,
 * sorts and paginates in the database.
 */
export default function PlayerSearch({ me }: { me: number }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const params = useMemo(() => userSearchSchema.parse(Object.fromEntries(searchParams)), [searchParams])
    // Latest params for callbacks that fire later (the debounced search): reading `params` from
    // their closure would resurrect values the user has changed in the meantime.
    const paramsRef = useRef(params)
    useEffect(() => { paramsRef.current = params }, [params])

    // The result remembers which query it answers; loading = it doesn't answer the current one.
    const [result, setResult] = useState<(UserSearchResult & { forQuery: string }) | null>(null)
    const [query, setQuery] = useState(params.q)

    function update(changes: Partial<UserSearchParams>) {
        const next = { ...paramsRef.current, ...changes }
        // Any change other than the page itself starts over from page 1.
        if (!('page' in changes)) next.page = 1
        // Record it now: a second change before the URL update lands must build on this one.
        paramsRef.current = next
        const qs = new URLSearchParams({
            q: next.q, sort: next.sort, order: next.order, filter: next.filter,
            page: String(next.page), pageSize: String(next.pageSize),
        })
        router.replace(`${pathname}?${qs}`, { scroll: false })
    }

    // Debounced name search: query the server 300 ms after the last keystroke.
    useEffect(() => {
        const id = setTimeout(() => {
            if (query.trim().toLowerCase() !== paramsRef.current.q) update({ q: query })
        }, 300)
        return () => clearTimeout(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- `update` only reads refs and the router
    }, [query])

    const queryString = useMemo(() => new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString(), [params])
    const loading = result?.forQuery !== queryString

    useEffect(() => {
        const controller = new AbortController()
        fetch(`/api/users?${queryString}`, { signal: controller.signal })
            .then(res => res.ok ? res.json() : null)
            .then((data: UserSearchResult | null) => { if (data) setResult({ ...data, forQuery: queryString }) })
            .catch(() => {})
        return () => controller.abort()
    }, [queryString])

    const users = useMemo(() => result?.users ?? [], [result])
    // In-game comes from the search result (game_engine's Redis set); online/offline is kept live by
    // the socket presence set, like every other status dot (see app/presence.tsx).
    const onlineUserIds = useActiveUserIds()
    const presenceOf = (u: { id: number; presence: Presence }): Presence =>
        u.presence === 'in_game' ? 'in_game' : onlineUserIds.has(u.id) ? 'online' : 'offline'
    const rankOffset = (params.page - 1) * params.pageSize

    return (
        <PageShell title="PLAYERS">
            <Panel maxWidth="max-w-4xl">
                <form role="search" onSubmit={e => e.preventDefault()} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <label className="flex flex-col gap-1 lg:col-span-2">
                        <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Search a name</span>
                        <input
                            type="search"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            maxLength={30}
                            placeholder="username…"
                            className={`${selectClass} px-3`}
                        />
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Show</span>
                        <select className={selectClass} value={params.filter} onChange={e => update({ filter: e.target.value as UserSearchParams['filter'] })}>
                            {Object.entries(FILTER_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </label>
                    <label className="flex flex-col gap-1">
                        <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Sort by</span>
                        <select className={selectClass} value={params.sort} onChange={e => update({ sort: e.target.value as UserSearchParams['sort'] })}>
                            {Object.entries(SORT_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </label>
                    <div className="flex gap-2">
                        <label className="flex flex-1 flex-col gap-1">
                            <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Order</span>
                            <select className={selectClass} value={params.order} onChange={e => update({ order: e.target.value as UserSearchParams['order'] })}>
                                <option value="desc">Descending</option>
                                <option value="asc">Ascending</option>
                            </select>
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="font-serif text-xs uppercase tracking-[0.2em] text-ink-muted">Per page</span>
                            <select className={selectClass} value={params.pageSize} onChange={e => update({ pageSize: Number(e.target.value) })}>
                                {USER_PAGE_SIZES.map(size => <option key={size} value={size}>{size}</option>)}
                            </select>
                        </label>
                    </div>
                </form>
            </Panel>

            <Panel maxWidth="max-w-4xl" aria-busy={loading}>
                <p className="mb-3 font-serif text-sm text-ink-muted" aria-live="polite">
                    {result ? `${result.total} player${result.total === 1 ? '' : 's'} found` : 'Loading…'}
                </p>
                {result && users.length === 0 ? <EmptyState>No player matches this search.</EmptyState> : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[32rem] font-serif text-sm text-ink-text">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wider text-ink-muted">
                                    <th scope="col" className="w-12 py-1">#</th>
                                    <th scope="col">Player</th>
                                    <th scope="col">Status</th>
                                    <th scope="col" className="text-right">Elo</th>
                                    <th scope="col" className="text-right">PvP wins</th>
                                    <th scope="col" className="text-right">Joined</th>
                                </tr>
                            </thead>
                            <tbody className={loading ? 'opacity-60' : ''}>
                                {users.map((u, i) => (
                                    <tr key={u.id} className={`border-t border-ink-muted/20 ${u.id === me ? 'bg-gold-300/30' : ''}`}>
                                        <td className="py-1.5">{params.sort === 'elo' && params.order === 'desc' && params.filter === 'all' && !params.q ? rankOffset + i + 1 : '·'}</td>
                                        <td>
                                            <Link href={ROUTES.profileOf(u.username)} className="flex items-center gap-2 hover:underline">
                                                <Avatar src={u.avatarUrl} username={u.username} size="sm" />
                                                <span className="truncate">{u.username}{u.id === me ? ' (you)' : ''}</span>
                                            </Link>
                                        </td>
                                        <td><PresenceDot presence={presenceOf(u)} showLabel /></td>
                                        <td className="text-right">{u.elo}</td>
                                        <td className="text-right">{u.pvpWins}</td>
                                        <td className="text-right" suppressHydrationWarning>{new Date(u.joinedAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {result && result.totalPages > 1 && (
                    <div className="mt-4">
                        <Pagination page={params.page} totalPages={result.totalPages} onChange={page => update({ page })} disabled={loading} />
                    </div>
                )}
            </Panel>
        </PageShell>
    )
}
