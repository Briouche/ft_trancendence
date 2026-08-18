'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import PackCardCircle from './PackCardCircle'
import PackCardZoom from './PackCardZoom'
import type { CardFaceData } from '@/components/CardFace'
import SceneLoading from '@/components/library/SceneLoading'

const VaultRoom = dynamic(() => import('./VaultRoom'), { ssr: false, loading: SceneLoading })

type Phase = 'idle' | 'shaking' | 'revealing'

export default function PackOpener({ initialPacks, initialPityCounter }: {
    initialPacks:        number
    initialPityCounter:  number
}) {
    const [packsLeft, setPacksLeft]             = useState(initialPacks)
    const [pityCounter, setPityCounter]         = useState(initialPityCounter)
    const [phase, setPhase]                     = useState<Phase>('idle')
    const [cards, setCards]                     = useState<CardFaceData[]>([])
    const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set())
    const [zoomedIndex, setZoomedIndex]         = useState<number | null>(null)
    const [error, setError]                     = useState('')
    const [granting, setGranting]               = useState(false)

    async function openPack() {
        if (packsLeft <= 0 || phase !== 'idle') return
        setError('')
        setPhase('shaking')

        const minShakeDelay = new Promise(resolve => setTimeout(resolve, 600))
        const [res] = await Promise.all([
            fetch('/api/packs/open', { method: 'POST' }),
            minShakeDelay,
        ])

        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            setError(body.error ?? "Unable to open this pack")
            setPhase('idle')
            return
        }

        const data: { cards: CardFaceData[]; unopenedPacks: number; pityCounter: number } = await res.json()

        setCards(data.cards)
        setPacksLeft(data.unopenedPacks)
        setPityCounter(data.pityCounter)
        setRevealedIndices(new Set())
        setPhase('revealing')
    }

    function revealCard(index: number) {
        setRevealedIndices(prev => {
            if (prev.has(index)) return prev
            const next = new Set(prev)
            next.add(index)
            return next
        })
    }

    function openAnother() {
        setPhase('idle')
        setCards([])
        setRevealedIndices(new Set())
        setZoomedIndex(null)
    }

    async function grantFreePack() {
        setGranting(true)
        const res = await fetch('/api/packs/grant', { method: 'POST' })
        if (res.ok) {
            const data: { unopenedPacks: number } = await res.json()
            setPacksLeft(data.unopenedPacks)
        }
        setGranting(false)
    }

    const allRevealed         = cards.length > 0 && revealedIndices.size === cards.length
    const packsUntilLegendary = 5 - pityCounter

    return (
        <VaultRoom phase={phase} openEnabled={phase === 'idle' && packsLeft > 0} onOpen={openPack}>
        {/* pointer-events-none sur le conteneur : le vide autour du texte (là où se trouve le
            coffre, dans le Canvas en dessous) doit laisser passer le clic jusqu'à lui — sinon ce
            conteneur (min-h-screen, donc plein écran même sans contenu visible partout) intercepte
            tout, y compris hors de ses éléments visibles, et le coffre ne reçoit jamais le clic. */}
        <div className="min-h-screen flex flex-col items-center p-6 md:p-10 gap-10 pointer-events-none">
            <div className="w-full max-w-3xl flex items-center justify-between rounded-xl bg-ink-950/80 backdrop-blur-sm p-4 pointer-events-auto">
                <div>
                    <p className="font-serif text-xs uppercase tracking-[0.25em] text-gold-400/70 mb-1">The Vault</p>
                    <h1 className="font-display text-3xl font-bold text-parchment-100">Pack Opening</h1>
                </div>
                <Link
                    href="/"
                    className="rounded-lg border border-leather-700 bg-ink-900 px-4 py-2 font-display text-sm
                        font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                >
                    ⟵ Menu
                </Link>
            </div>

            <div className="text-center pointer-events-auto">
                <p className="font-serif text-parchment-300/70">
                    {packsLeft} pack{packsLeft !== 1 ? 's' : ''} available
                    {' · '}
                    <span className="text-gold-400">
                        {packsUntilLegendary} pack{packsUntilLegendary !== 1 ? 's' : ''} until guaranteed legendary
                    </span>
                </p>
                {/* Bouton temporaire en attendant un vrai mode de jeu pour gagner des paquets */}
                <button
                    onClick={grantFreePack}
                    disabled={granting}
                    className="mt-3 rounded-full border border-leather-700 bg-ink-900 px-3 py-1.5 font-serif text-xs
                        text-parchment-300/70 transition-colors hover:bg-ink-800 disabled:opacity-40"
                >
                    ✦ {granting ? 'Adding...' : 'Get a free pack (temporary)'}
                </button>

                {/* Le coffre lui-même (dans la scène 3D derrière) est le bouton d'ouverture — ce
                    texte remplace l'ancienne carte 2D "Tap to open" posée par-dessus. */}
                {(phase === 'idle' || phase === 'shaking') && (
                    <p className="mt-4 font-serif text-sm italic text-parchment-300/50">
                        {packsLeft > 0 ? 'Click the chest to open a pack' : 'No packs available'}
                    </p>
                )}
            </div>

            {error && <p className="pointer-events-auto font-serif text-red-400">{error}</p>}

            {phase === 'revealing' && (
                <div className="flex flex-col items-center gap-10 pointer-events-auto">
                    {!allRevealed && (
                        <p className="-mt-6 font-serif text-sm italic text-parchment-300/50">
                            Tap a card to reveal it
                        </p>
                    )}

                    <PackCardCircle
                        cards={cards}
                        revealedIndices={revealedIndices}
                        onSelect={setZoomedIndex}
                    />

                    {allRevealed && (
                        <div className="flex gap-4">
                            {packsLeft > 0 && (
                                <button
                                    onClick={openAnother}
                                    className="rounded-lg border border-gold-500/50 bg-leather-800 px-6 py-3 font-display
                                        font-bold text-parchment-100 shadow transition-colors hover:bg-leather-700"
                                >
                                    Open another pack
                                </button>
                            )}
                            <Link
                                href="/collection"
                                className="rounded-lg border border-leather-700 bg-ink-900 px-6 py-3 font-display
                                    font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                            >
                                View my collection
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>

        <PackCardZoom
            card={zoomedIndex !== null ? cards[zoomedIndex] : null}
            revealed={zoomedIndex !== null && revealedIndices.has(zoomedIndex)}
            onReveal={() => { if (zoomedIndex !== null) revealCard(zoomedIndex) }}
            onClose={() => setZoomedIndex(null)}
        />
        </VaultRoom>
    )
}
