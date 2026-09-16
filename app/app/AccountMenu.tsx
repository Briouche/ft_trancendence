'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logoutUser } from '@/lib/auth/formActions'
import { AssetButton } from '@/components/notebook/NotebookUI'
import { ROUTES } from '@/config/routes'
import { english } from '@/config/english'
import { getVolume, setVolume, type VolumeChannel } from '@/lib/audioSettings'

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

type Panel = 'account' | 'settings' | 'trophy' | null

const VOLUME_ROWS: { channel: VolumeChannel; label: string }[] = [
    { channel: 'master',   label: 'Game volume' },
    { channel: 'music',    label: 'Music' },
    { channel: 'ambience', label: 'Ambience' },
]

// A native <input type="range"> rather than a dedicated asset — the notebook UI pack only ships
// vertical scrollbars (see NotebookUI.tsx) — styled with the panel's own ink/parchment palette.
// Reads/writes lib/audioSettings.ts (localStorage) directly.
function VolumeSlider({ channel, label, value, onChange }: {
    channel: VolumeChannel
    label:   string
    value:   number
    onChange: (channel: VolumeChannel, value: number) => void
}) {
    return (
        <label className="flex flex-col gap-1 font-serif text-sm text-ink-muted">
            <span className="flex justify-between">
                <span>{label}</span>
                <span>{Math.round(value * 100)}%</span>
            </span>
            <input
                type="range"
                min={0} max={1} step={0.01}
                value={value}
                onChange={e => onChange(channel, Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-ink-900/20 accent-leather-700"
            />
        </label>
    )
}

// Account/settings/trophy dropdown — the only account UI now that the Hub is navigated
// entirely in 3D. Icons are the 01_TravelBook set (ButtonAbout01a/ButtonSetting01a/
// ButtonAchievement01a, via AssetButton). Settings opens a volume panel (lib/audioSettings.ts);
// Achievement shows win counts (winsVsAi{Easy,Medium,Hard}/winsVsPlayer on User). Quick stats live
// here; full profile editing and friends management are on the separate /profile and /friends
// pages linked below — card backs are still picked from the Collection (same API).
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

    return (
        <div className="pointer-events-auto absolute right-4 top-4 z-50">
            <div className="flex items-center gap-2">
                <AssetButton onClick={() => toggle('account')} variant="about" className="h-14 w-14 shrink-0" />
                <AssetButton onClick={() => toggle('settings')} variant="music" className="h-14 w-14 shrink-0" />
                <AssetButton onClick={() => toggle('trophy')} variant="achievement" className="h-14 w-14 shrink-0" />
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

                    <div className="my-3 h-px bg-ink-muted/30" />

                    <Link
                        href={ROUTES.profile}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 font-serif text-sm text-ink-muted transition-colors hover:bg-ink-900/10"
                    >
                        👤 Full profile
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

                    <AssetButton onClick={() => logoutUser()} variant="square" className="h-10 w-full">
                        Log out
                    </AssetButton>
                </div>
            )}

            {openPanel === 'settings' && (
                <div className="book-panel absolute right-0 mt-2 w-64 p-3" onMouseLeave={() => setOpenPanel(null)}>
                    <p className="font-serif text-xs uppercase tracking-wide text-ink-muted mb-2">⚙️ Sound</p>
                    <div className="flex flex-col gap-3">
                        {VOLUME_ROWS.map(({ channel, label }) => (
                            <VolumeSlider
                                key={channel}
                                channel={channel}
                                label={label}
                                value={volumes[channel]}
                                onChange={handleVolumeChange}
                            />
                        ))}
                    </div>
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
                </div>
            )}
        </div>
    )
}
