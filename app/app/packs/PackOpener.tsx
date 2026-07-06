'use client'

import { useState } from 'react'
import Link from 'next/link'
import PackCardReveal from './PackCardReveal'
import type { CardFaceData } from '@/components/CardFace'

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
            setError(body.error ?? "Impossible d'ouvrir ce paquet")
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
        <div className="min-h-screen bg-ink-950 flex flex-col items-center p-6 md:p-10 gap-10">
            <div className="w-full max-w-3xl flex items-center justify-between">
                <div>
                    <p className="font-serif text-xs uppercase tracking-[0.25em] text-gold-400/70 mb-1">Le Coffre</p>
                    <h1 className="font-display text-3xl font-bold text-parchment-100">Ouverture de paquets</h1>
                </div>
                <Link
                    href="/"
                    className="rounded-lg border border-leather-700 bg-ink-900 px-4 py-2 font-display text-sm
                        font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                >
                    ⟵ Menu
                </Link>
            </div>

            <div className="text-center">
                <p className="font-serif text-parchment-300/70">
                    {packsLeft} paquet{packsLeft !== 1 ? 's' : ''} disponible{packsLeft !== 1 ? 's' : ''}
                    {' · '}
                    <span className="text-gold-400">
                        {packsUntilLegendary} paquet{packsUntilLegendary !== 1 ? 's' : ''} avant légendaire garantie
                    </span>
                </p>
                {/* Bouton temporaire en attendant un vrai mode de jeu pour gagner des paquets */}
                <button
                    onClick={grantFreePack}
                    disabled={granting}
                    className="mt-3 rounded-full border border-leather-700 bg-ink-900 px-3 py-1.5 font-serif text-xs
                        text-parchment-300/70 transition-colors hover:bg-ink-800 disabled:opacity-40"
                >
                    ✦ {granting ? 'Ajout...' : 'Gagner un paquet gratuit (temporaire)'}
                </button>
            </div>

            {(phase === 'idle' || phase === 'shaking') && (
                <button
                    onClick={openPack}
                    disabled={packsLeft <= 0}
                    className={`flex h-64 w-48 flex-col items-center justify-center gap-3 rounded-2xl border-4
                        border-gold-500/50 bg-gradient-to-br from-leather-800 to-ink-900 shadow-2xl
                        transition-transform disabled:cursor-not-allowed disabled:opacity-30
                        ${phase === 'shaking' ? 'animate-pack-shake' : 'cursor-pointer hover:scale-105'}`}
                >
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold-400/70 bg-leather-900/50">
                        <span className="font-display text-3xl text-gold-400/90">✦</span>
                    </div>
                    <span className="font-display font-bold text-parchment-100">
                        {packsLeft > 0 ? 'Toucher pour ouvrir' : 'Aucun paquet'}
                    </span>
                </button>
            )}

            {error && <p className="font-serif text-red-400">{error}</p>}

            {phase === 'revealing' && (
                <>
                    {!allRevealed && (
                        <p className="-mt-6 font-serif text-sm italic text-parchment-300/50">
                            Touche une carte pour la révéler
                        </p>
                    )}

                    <div className="w-full max-w-3xl grid grid-cols-5 gap-4">
                        {cards.map((card, i) => (
                            <PackCardReveal
                                key={`${card.id}-${i}`}
                                card={card}
                                revealed={revealedIndices.has(i)}
                                onReveal={() => revealCard(i)}
                            />
                        ))}
                    </div>

                    {allRevealed && (
                        <div className="flex gap-4">
                            {packsLeft > 0 && (
                                <button
                                    onClick={openAnother}
                                    className="rounded-lg border border-gold-500/50 bg-leather-800 px-6 py-3 font-display
                                        font-bold text-parchment-100 shadow transition-colors hover:bg-leather-700"
                                >
                                    Ouvrir un autre paquet
                                </button>
                            )}
                            <Link
                                href="/collection"
                                className="rounded-lg border border-leather-700 bg-ink-900 px-6 py-3 font-display
                                    font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                            >
                                Voir ma collection
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
