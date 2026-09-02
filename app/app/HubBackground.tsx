'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import SceneLoading from '@/components/library/SceneLoading'

const HubScene = dynamic(() => import('./HubScene'), { ssr: false, loading: SceneLoading })

// Monté une seule fois dans le layout racine (jamais démonté entre deux pages, même principe que
// AudioProvider — voir layout.tsx) plutôt que recréé à chaque retour sur "/" : reconstruire le
// Canvas three-fiber à froid (contexte WebGL, compilation des shaders, géométrie procédurale des
// bibliothèques...) est ce qui causait le demi-seconde de gel avant affichage. `hidden` (display:
// none) masque la scène sur les autres routes sans jamais couper son contexte WebGL, contrairement
// à un démontage React.
//
// cardCount/wins ne viennent plus des props serveur de HomePage (qui ne s'exécutent qu'à son
// propre montage) mais d'un fetch client relancé à chaque retour sur "/", pour rester à jour après
// une action faite ailleurs (ouvrir un pack, gagner une partie) sans jamais recréer ce composant.
export default function HubBackground({ username }: { username: string }) {
    const pathname = usePathname()
    const isHome = pathname === '/'
    const [stats, setStats] = useState({ cardCount: 0, wins: 0 })

    useEffect(() => {
        if (!isHome) return
        let cancelled = false

        fetch('/api/user/summary')
            .then(res => res.ok ? res.json() : null)
            .then(data => { if (data && !cancelled) setStats({ cardCount: data.cardCount, wins: data.wins }) })

        return () => { cancelled = true }
    }, [isHome])

    return (
        <div className={isHome ? '' : 'hidden'}>
            <HubScene username={username} cardCount={stats.cardCount} wins={stats.wins} active={isHome} />
        </div>
    )
}
