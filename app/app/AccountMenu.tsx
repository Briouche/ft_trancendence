'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logoutUser } from '@/lib/auth'
import { AssetButton } from '@/components/notebook/NotebookUI'
import { ROUTES } from '@/config/routes'
import { english } from '@/config/english'

export type WinsBreakdown = {
    vsAiEasy:   number
    vsAiMedium: number
    vsAiHard:   number
    vsPlayer:   number
}

export type CardBacksSummary = {
    unlocked: number
    total:    number
}

type Panel = 'account' | 'trophy' | null

// Account menu links besides the profile and legal pages.
const SOCIAL_LINKS = [
    { href: ROUTES.friends, icon: '🧑‍🤝‍🧑', label: 'Friends' },
    { href: ROUTES.chat, icon: '💬', label: 'Chat' },
    { href: ROUTES.players, icon: '🔎', label: 'Players & leaderboard' },
    { href: ROUTES.achievements, icon: '🏆', label: 'Achievements' },
]

/** Top-right dropdowns of the hub: account summary + links, and win counts. */
export default function AccountMenu({ username, cardCount, elo, wins, cardBacks }: {
    username:  string
    cardCount: number
    elo:       number
    wins:      WinsBreakdown
    cardBacks: CardBacksSummary
}) {
    const [openPanel, setOpenPanel] = useState<Panel>(null)

    function toggle(panel: Panel) {
        setOpenPanel(current => current === panel ? null : panel)
    }

    return (
        <div className="pointer-events-auto absolute right-4 top-4 z-50">
            <div className="flex items-center gap-2">
                <AssetButton onClick={() => toggle('account')} variant="about" className="h-14 w-14 shrink-0" ariaLabel="Account menu" expanded={openPanel === 'account'} />
                <AssetButton onClick={() => toggle('trophy')} variant="achievement" className="h-14 w-14 shrink-0" ariaLabel="Wins" expanded={openPanel === 'trophy'} />
            </div>

            {openPanel === 'account' && (
                <div className="book-panel absolute right-0 mt-2 w-64 p-3" onMouseLeave={() => setOpenPanel(null)}>
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
                        👤 Full profile
                    </Link>
                    {SOCIAL_LINKS.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-serif text-sm text-ink-muted transition-colors hover:bg-ink-900/10"
                        >
                            <span aria-hidden="true">{link.icon}</span> {link.label}
                        </Link>
                    ))}

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
                    <Link
                        href={ROUTES.designSystem}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-serif text-sm text-ink-muted transition-colors hover:bg-ink-900/10"
                    >
                        🎨 Design system
                    </Link>

                    <div className="my-3 h-px bg-ink-muted/30" />

                    <AssetButton onClick={() => logoutUser()} variant="square" className="h-10 w-full">
                        Log out
                    </AssetButton>
                </div>
            )}

            {openPanel === 'trophy' && (
                <div className="book-panel absolute right-0 mt-2 w-64 p-3" onMouseLeave={() => setOpenPanel(null)}>
                    <p className="font-serif text-xs uppercase tracking-wide text-ink-muted mb-1">🏆 Wins</p>
                    <div className="flex flex-col gap-0.5 font-serif text-sm text-ink-muted">
                        <p className="flex justify-between"><span>vs AI (Easy)</span><span>{wins.vsAiEasy}</span></p>
                        <p className="flex justify-between"><span>vs AI (Medium)</span><span>{wins.vsAiMedium}</span></p>
                        <p className="flex justify-between"><span>vs AI (Hard)</span><span>{wins.vsAiHard}</span></p>
                        <p className="flex justify-between"><span>vs Player</span><span>{wins.vsPlayer}</span></p>
                    </div>
                    <Link href={ROUTES.achievements} className="mt-3 block font-serif text-sm text-ink-text underline">
                        See all achievements →
                    </Link>
                </div>
            )}
        </div>
    )
}
