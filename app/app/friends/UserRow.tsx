import Link from 'next/link'
import Avatar from '@/components/ui/Avatar'
import PresenceDot from '@/components/ui/PresenceDot'
import { ROUTES } from '@/config/routes'
import type { Presence } from '@/lib/presenceTypes'

export type UserSummary = { id: number; username: string; avatarUrl: string; elo: number; presence: Presence }

/** One user line: avatar, name (linking to their profile), presence, then `actions` on the right. */
export default function UserRow({ user, presence, actions }: {
    user: UserSummary
    presence: Presence
    actions?: React.ReactNode
}) {
    return (
        <li className="travelbook-slot flex flex-wrap items-center gap-3 px-3 py-2">
            <Avatar src={user.avatarUrl} username={user.username} size="sm" />
            <div className="flex min-w-0 flex-1 flex-col">
                <Link href={ROUTES.user(user.username)} className="truncate font-display text-base text-ink-text hover:underline">
                    {user.username}
                </Link>
                <PresenceDot presence={presence} showLabel />
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </li>
    )
}
