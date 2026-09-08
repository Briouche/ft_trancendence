// Volume preferences, shared across all pages (Settings in AccountMenu.tsx writes, site sounds —
// the page-flip, see NotebookUI.tsx — read them). Persisted to localStorage: purely cosmetic and
// per-device, no reason to round-trip to the database for this.
export type VolumeChannel = 'master' | 'music' | 'ambience'

const STORAGE_KEY = 'audioSettings'

const DEFAULT_VOLUMES: Record<VolumeChannel, number> = {
    master:   1,
    music:    0.6,
    ambience: 0.6,
}

function loadVolumes(): Record<VolumeChannel, number> {
    if (typeof window === 'undefined') return DEFAULT_VOLUMES
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (!raw) return DEFAULT_VOLUMES
        return { ...DEFAULT_VOLUMES, ...JSON.parse(raw) }
    } catch {
        return DEFAULT_VOLUMES
    }
}

let volumes = loadVolumes()
const listeners = new Set<(volumes: Record<VolumeChannel, number>) => void>()

export function getVolume(channel: VolumeChannel): number {
    return volumes[channel]
}

// A channel's effective volume = its own slider x the master slider (a classic music/sfx/master
// mixer, not 3 independent sliders) — this is the value to apply to an HTMLAudioElement before
// playing it, never getVolume('music'/'ambience') alone.
export function getEffectiveVolume(channel: 'music' | 'ambience'): number {
    return volumes.master * volumes[channel]
}

export function setVolume(channel: VolumeChannel, value: number): void {
    volumes = { ...volumes, [channel]: value }
    if (typeof window !== 'undefined') {
        try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(volumes)) } catch {}
    }
    listeners.forEach(listener => listener(volumes))
}

// Used by components that render a slider (VolumeSlider, AccountMenu) to stay in sync if volume
// changes elsewhere (e.g. two open tabs) without prop-drilling.
export function subscribeVolumes(listener: (volumes: Record<VolumeChannel, number>) => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
}
