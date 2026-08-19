'use client'

import { useAudio } from './AudioProvider'

// Bouton flottant global (posé dans le layout racine, donc visible sur toutes les pages) : seul
// moyen de couper la nappe ambiante puisqu'elle démarre toute seule au premier clic dans l'appli.
export default function AudioToggleButton() {
    const { muted, toggleMute } = useAudio()

    return (
        <button
            onClick={toggleMute}
            aria-label={muted ? 'Activer le son' : 'Couper le son'}
            className="pointer-events-auto fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center
                justify-center rounded-full border border-leather-700 bg-ink-900/90 text-lg
                text-parchment-100 backdrop-blur-sm shadow-lg transition-colors hover:bg-ink-800"
        >
            {muted ? '🔇' : '🔈'}
        </button>
    )
}
