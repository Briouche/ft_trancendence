'use client'

import Link from 'next/link'
import { MENU_ITEMS } from './menu'
import AccountMenu, { type WinsBreakdown, type CardBacksSummary } from '@/components/account-menu/AccountMenu'

// Text menu shown instead of the 3D hall when WebGL2 is unavailable.
export default function SimpleHubMenu({ username, cardCount, elo, wins, cardBacks }: {
    username:  string
    cardCount: number
    elo:       number
    wins:      WinsBreakdown
    cardBacks: CardBacksSummary
}) {
    return (
        <div className="relative flex h-screen w-full flex-col items-center justify-center gap-10 overflow-y-auto bg-ink-950 px-6 py-12">
            <h1
                className="text-center font-engraved tracking-wide text-parchment-200 [text-shadow:0_3px_10px_rgba(0,0,0,0.9)]"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
                ft_transcendence
            </h1>

            <nav className="flex w-full max-w-[min(90vw,32rem)] flex-col gap-3">
                {MENU_ITEMS.map(item => (
                    <Link
                        key={item.href}
                        href={item.available ? item.href : '#'}
                        aria-disabled={!item.available}
                        className={`flex items-center justify-between rounded-md border border-leather-700 bg-ink-900 px-5 py-4 font-serif text-parchment-200 transition-colors
                            ${item.available ? 'hover:border-gold-400 hover:text-gold-300' : 'pointer-events-none opacity-50'}`}
                        style={{ fontSize: 'clamp(1rem, 2vw, 1.25rem)' }}
                    >
                        <span>{item.emoji ? `${item.emoji} ` : ''}{item.label}</span>
                        <span className="text-parchment-300" style={{ fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)' }}>
                            {item.available ? item.description : 'Locked'}
                        </span>
                    </Link>
                ))}
            </nav>

            <AccountMenu username={username} cardCount={cardCount} elo={elo} wins={wins} cardBacks={cardBacks} />
        </div>
    )
}
