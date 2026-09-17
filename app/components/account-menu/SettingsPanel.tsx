import { type VolumeChannel } from '@/lib/audioSettings'

const VOLUME_ROWS: { channel: VolumeChannel; label: string }[] = [
    { channel: 'master',   label: 'Game volume' },
    { channel: 'music',    label: 'Music' },
    { channel: 'ambience', label: 'Ambience' },
]

// A native <input type="range"> rather than a dedicated asset — the notebook UI pack only ships
// vertical scrollbars (see NotebookUI.tsx) — styled with the panel's own ink/parchment palette.
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

export default function SettingsPanel({ volumes, onVolumeChange, onClose }: {
    volumes:  Record<VolumeChannel, number>
    onVolumeChange: (channel: VolumeChannel, value: number) => void
    onClose:  () => void
}) {
    return (
        <div className="book-panel absolute right-0 mt-2 w-64 p-3" onMouseLeave={onClose}>
            <p className="font-serif text-xs uppercase tracking-wide text-ink-muted mb-2">⚙️ Sound</p>
            <div className="flex flex-col gap-3">
                {VOLUME_ROWS.map(({ channel, label }) => (
                    <VolumeSlider
                        key={channel}
                        channel={channel}
                        label={label}
                        value={volumes[channel]}
                        onChange={onVolumeChange}
                    />
                ))}
            </div>
        </div>
    )
}
