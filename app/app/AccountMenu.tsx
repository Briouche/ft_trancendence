'use client'

import { useState } from 'react'
import Link from 'next/link'
import { logoutUser } from '@/lib/auth'
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

// Un curseur natif (<input type="range">) plutôt qu'un asset dédié : le pack d'UI du carnet n'en
// fournit pas (juste des barres de scroll verticales, voir NotebookUI.tsx) — stylé avec la même
// palette encre/parchemin que le reste du panneau plutôt que d'importer un nouvel asset. Lit/écrit
// directement lib/audioSettings.ts (localStorage) ; le parent (re)affiche la valeur via `value`
// pour rester synchro si le volume change ailleurs (getVolume relu à l'ouverture du panneau).
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

// Remplace l'ancien bouton "☰ Simple menu" : un accès rapide au compte plutôt qu'un repli de
// navigation à plat — la 3D est maintenant la seule façon de naviguer le Hub. Structuré comme un
// vrai menu déroulant (profil / paramètres / trophée) plutôt qu'un simple panneau de stats.
// Rangée de 3 icônes 01_TravelBook (ButtonAbout01a/ButtonSetting01a/ButtonAchievement01a, via
// AssetButton) plutôt que le seul bouton texte "👤 {username}" d'avant. Settings ouvre maintenant
// un panneau de volumes (master/musique/ambiance, voir lib/audioSettings.ts) plutôt que de rester
// désactivé ; Achievement ouvre son propre panneau (les victoires, voir
// winsVsAi{Easy,Medium,Hard}/winsVsPlayer sur User).
//
// Plus de page /profile séparée : tout ce qu'elle montrait (stats, dos de carte) tient maintenant
// ici — le dos de carte se choisit déjà depuis la Collection (même API), donc rien n'est perdu à
// la retirer, juste un aller-retour en moins.
export default function AccountMenu({ username, cardCount, wins, cardBacks }: {
    username:  string
    cardCount: number
    wins:      WinsBreakdown
    cardBacks: CardBacksSummary
}) {
    const [openPanel, setOpenPanel] = useState<Panel>(null)
    // Relu depuis lib/audioSettings.ts (localStorage) à l'ouverture du panneau plutôt qu'à chaque
    // rendu de AccountMenu : cet état local sert juste à faire réagir les curseurs immédiatement
    // au drag, pas de source de vérité — setVolume() reste celle qui persiste.
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
