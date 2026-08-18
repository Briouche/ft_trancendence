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

    // Logique d'ouverture proprement dite, séparée du clic sur le coffre : "Open another pack"
    // doit la déclencher directement (le coffre s'anime tout seul), sans repasser par idle et
    // attendre un nouveau clic sur le coffre.
    async function runOpen() {
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

    function openPack() {
        if (packsLeft <= 0 || phase !== 'idle') return
        runOpen()
    }

    function revealCard(index: number) {
        setRevealedIndices(prev => {
            if (prev.has(index)) return prev
            const next = new Set(prev)
            next.add(index)
            return next
        })
    }

    // Premier clic sur une carte encore dos tourné : elle se retourne sur place, dans le cercle
    // (petite), sans passer au premier plan. Recliquer une carte déjà révélée l'amène en grand
    // (PackCardZoom), qui reste ouvert jusqu'à un clic à côté pour le refermer.
    function selectCard(index: number) {
        if (revealedIndices.has(index)) {
            setZoomedIndex(index)
        } else {
            revealCard(index)
        }
    }

    // "Back" : referme le coffre et revient à idle, un nouveau clic sur le coffre est nécessaire.
    function goBack() {
        setPhase('idle')
        setCards([])
        setRevealedIndices(new Set())
        setZoomedIndex(null)
    }

    // "Open another pack" : le coffre doit s'ouvrir directement, sans repasser par un clic dessus.
    function openAnotherPack() {
        if (packsLeft <= 0) return
        setCards([])
        setRevealedIndices(new Set())
        setZoomedIndex(null)
        runOpen()
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
        </div>

        {phase === 'revealing' && (
            // Cercle sorti du flux normal (fixed, centré sur TOUTE la fenêtre) plutôt que posé
            // dans la colonne sous l'en-tête : sinon la hauteur du bandeau du dessus repousse le
            // cercle vers le bas et ses cartes du bas sortent de l'écran. pointer-events-none :
            // le centre (occupé par le coffre) est vide, ne doit pas intercepter le zoom affiché
            // par-dessus au même endroit — chaque élément interactif repasse en pointer-events-auto.
            <div className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-6
                bg-ink-950/40 backdrop-blur-md pointer-events-none">
                {/* Colonne de gauche : "Back" visible dès l'ouverture du paquet (pas besoin
                    d'attendre d'avoir tout révélé pour revenir au coffre), puis les deux autres
                    boutons juste en dessous une fois tout révélé — plus un rang centré à part. */}
                <div className="pointer-events-auto absolute left-6 top-6 flex flex-col gap-3">
                    <button
                        onClick={goBack}
                        className="rounded-lg border border-leather-700 bg-ink-900 px-4 py-2
                            font-display text-sm font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                    >
                        ⟵ Back
                    </button>

                    {allRevealed && packsLeft > 0 && (
                        <button
                            onClick={openAnotherPack}
                            className="rounded-lg border border-gold-500/50 bg-leather-800 px-4 py-2 font-display
                                text-sm font-bold text-parchment-100 shadow transition-colors hover:bg-leather-700"
                        >
                            Open another pack
                        </button>
                    )}
                    {allRevealed && (
                        <Link
                            href="/collection"
                            className="rounded-lg border border-leather-700 bg-ink-900 px-4 py-2 font-display
                                text-sm font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                        >
                            View my collection
                        </Link>
                    )}
                </div>

                {!allRevealed && (
                    <p className="font-serif text-sm italic text-parchment-300/60">
                        Tap a card to reveal it
                    </p>
                )}

                <PackCardCircle
                    cards={cards}
                    revealedIndices={revealedIndices}
                    onSelect={selectCard}
                />
            </div>
        )}

        <PackCardZoom
            card={zoomedIndex !== null ? cards[zoomedIndex] : null}
            onClose={() => setZoomedIndex(null)}
        />
        </VaultRoom>
    )
}
