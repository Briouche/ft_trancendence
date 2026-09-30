import { useTransition } from 'react'
import Link from 'next/link'
import { logoutUser } from '@/lib/auth/authActions'
import { AssetButton } from '@/components/notebook/AssetButton'
import { ROUTES } from '@/config/routes'
import { english } from '@/config/english'

export type CardBacksSummary = {
    unlocked: number
    total:    number
}

export default function AccountPanel({ username, cardCount, elo, cardBacks, onClose }: {
    username:  string
    cardCount: number
    elo:       number
    cardBacks: CardBacksSummary
    onClose:   () => void
}) {
    // Inside a transition so Next's router handles the NEXT_REDIRECT that logoutUser's redirect()
    // rejects the action with; called bare, it surfaced as an uncaught promise error.
    const [isLoggingOut, startLogout] = useTransition()

    return (
        <div className="book-panel absolute right-0 mt-2 w-64 p-3" onMouseLeave={onClose}>
            <p className="font-display text-lg font-bold text-ink-text truncate">{username}</p>
            <p className="mt-1 font-serif text-sm text-ink-muted">
                🃏 {cardCount} card{cardCount !== 1 ? 's' : ''} collected
            </p>
            <p className="mt-0.5 font-serif text-sm text-ink-muted">
                🎴 {cardBacks.unlocked}/{cardBacks.total} card backs unlocked
            </p>
            <p className="mt-0.5 font-serif text-sm text-ink-muted">
                🏆 Elo : {elo}
            </p>

            <div className="my-3 h-px bg-ink-muted/30" />

            <Link
                href={ROUTES.profile}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-serif text-sm text-ink-muted transition-colors hover:bg-ink-900/10"
            >
                👤 Profile
            </Link>
            <Link
                href={ROUTES.friends}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-serif text-sm text-ink-muted transition-colors hover:bg-ink-900/10"
            >
                🧑‍🤝‍🧑 Friends
            </Link>

            <div className="my-3 h-px bg-ink-muted/30" />

            {/* Policy */}
            <Link
                href={ROUTES.privacyNotice}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-serif text-sm text-ink-muted transition-colors hover:bg-ink-900/10"
            >
                📜 {english.privacyPolicy}
            </Link>
            <Link
                href={ROUTES.termsOfUse}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-serif text-sm text-ink-muted transition-colors hover:bg-ink-900/10"
            >
                📜 {english.termsOfService}
            </Link>

            <div className="my-3 h-px bg-ink-muted/30" />

            <AssetButton onClick={() => startLogout(() => logoutUser())} disabled={isLoggingOut} variant="square" className="h-10 w-full">
                Log out
            </AssetButton>
        </div>
    )
}
