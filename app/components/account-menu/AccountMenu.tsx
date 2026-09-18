'use client'

import { useState } from 'react'
import { AssetButton } from '@/components/notebook/AssetButton'
import { getVolume, setVolume, type VolumeChannel } from '@/lib/audioSettings'
import AccountPanel, { type CardBacksSummary } from './AccountPanel'
import SettingsPanel from './SettingsPanel'
import TrophyPanel, { type WinsBreakdown } from './TrophyPanel'

export type { WinsBreakdown } from './TrophyPanel'
export type { CardBacksSummary } from './AccountPanel'

type Panel = 'account' | 'settings' | 'trophy' | null

// Account/settings/trophy dropdown — the only account UI now that the Hub is navigated
// entirely in 3D. Icons are the 01_TravelBook set (ButtonAbout01a/ButtonSetting01a/
// ButtonAchievement01a, via AssetButton). Settings opens a volume panel (lib/audioSettings.ts);
// Achievement shows win counts (winsVsAi{Easy,Medium,Hard}/winsVsPlayer on User). Quick stats live
// here; full profile editing and friends management are on the separate /profile and /friends
// pages linked from AccountPanel — card backs are still picked from the Collection (same API).
export default function AccountMenu({ username, cardCount, wins, cardBacks }: {
    username:  string
    cardCount: number
    wins:      WinsBreakdown
    cardBacks: CardBacksSummary
}) {
    const [openPanel, setOpenPanel] = useState<Panel>(null)
    // Read from lib/audioSettings.ts (localStorage) once when the panel opens rather than on
    // every AccountMenu render: this local state only makes the sliders react immediately while
    // dragging, it isn't the source of truth — setVolume() is what actually persists.
    const [volumes, setVolumes] = useState(() => ({
        master:   getVolume('master'),
        music:    getVolume('music'),
        ambience: getVolume('ambience'),
    }))

    function toggle(panel: Panel) {
        setOpenPanel(current => current === panel ? null : panel)
    }

    function handleVolumeChange(channel: VolumeChannel, value: number) {
        setVolume(channel, value)
        setVolumes(current => ({ ...current, [channel]: value }))
    }

    const closePanel = () => setOpenPanel(null)

    return (
        <div className="pointer-events-auto absolute right-4 top-4 z-50">
            <div className="flex items-center gap-2">
                <AssetButton onClick={() => toggle('account')} variant="about" className="h-14 w-14 shrink-0" />
                <AssetButton onClick={() => toggle('settings')} variant="music" className="h-14 w-14 shrink-0" />
                <AssetButton onClick={() => toggle('trophy')} variant="achievement" className="h-14 w-14 shrink-0" />
            </div>

            {openPanel === 'account' && (
                <AccountPanel username={username} cardCount={cardCount} cardBacks={cardBacks} onClose={closePanel} />
            )}

            {openPanel === 'settings' && (
                <SettingsPanel volumes={volumes} onVolumeChange={handleVolumeChange} onClose={closePanel} />
            )}

            {openPanel === 'trophy' && (
                <TrophyPanel wins={wins} onClose={closePanel} />
            )}
        </div>
    )
}
