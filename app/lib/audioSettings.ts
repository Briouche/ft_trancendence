// Préférences de volume, partagées entre toutes les pages (Settings dans AccountMenu.tsx écrit,
// les sons du site — page-flip pour l'instant, voir NotebookUI.tsx — lisent). Persisté en
// localStorage : purement cosmétique et par appareil, aucune raison d'aller jusqu'en base pour ça.
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

// Volume réel d'un canal = son propre curseur × le volume général (mixeur classique
// musique/bruitages/master, pas 3 curseurs indépendants) — c'est CE volume qu'il faut appliquer à
// un HTMLAudioElement avant de le jouer, jamais getVolume('music'/'ambience') seul.
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

// Utilisé par les composants affichant un curseur (VolumeSlider, AccountMenu) pour rester
// synchronisés si le volume change ailleurs (deux onglets ouverts, par ex.) sans prop-drilling.
export function subscribeVolumes(listener: (volumes: Record<VolumeChannel, number>) => void): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
}
