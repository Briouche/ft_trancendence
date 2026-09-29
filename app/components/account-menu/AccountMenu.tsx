'use client'

import { useState } from 'react'
import { AssetButton } from '@/components/notebook/AssetButton'
import AccountPanel, { type CardBacksSummary } from './AccountPanel'
import TrophyPanel, { type WinsBreakdown } from './TrophyPanel'

export type { WinsBreakdown } from './TrophyPanel'
export type { CardBacksSummary } from './AccountPanel'

type Panel = 'account' | 'trophy' | null

// Top-right dropdowns of the hub: account summary + links, and win counts.
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

    const closePanel = () => setOpenPanel(null)

    return (
        <div className="pointer-events-auto absolute right-4 top-4 z-50">
            <div className="flex items-center gap-2">
                <AssetButton onClick={() => toggle('account')} variant="about" className="h-14 w-14 shrink-0" />
                <AssetButton onClick={() => toggle('trophy')} variant="achievement" className="h-14 w-14 shrink-0" />
            </div>

            {openPanel === 'account' && (
                <AccountPanel username={username} cardCount={cardCount} elo={elo} cardBacks={cardBacks} onClose={closePanel} />
            )}

            {openPanel === 'trophy' && (
                <TrophyPanel wins={wins} onClose={closePanel} />
            )}
        </div>
    )
}
