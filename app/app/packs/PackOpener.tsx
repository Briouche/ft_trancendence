'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PackCardCircle from './PackCardCircle'
import PackCardZoom from './PackCardZoom'
import PackChoice from './PackChoice'
import PackArt, { randomPackSkins, type PackSkin } from './PackArt'
import CardBackArt from '@/components/CardBackArt'
import type { CardFaceData } from '@/components/CardFace'
import { useAudio } from '@/components/AudioProvider'
import RoundedRectangle from '@/components/elements/RoundedRectangle'

type Phase = 'choosing' | 'opening' | 'revealing'

// Angle de la déchirure mesuré sur le sprite "cardRIPfx" (diff entre sa frame "intacte" et sa
// frame juste avant séparation) : la ligne de crack va de (0%, 30%) à gauche à (100%, 66%) à
// droite. FLAP = le triangle au-dessus (le coin haut-droit qui part) ; BODY = le reste.
const FLAP_CLIP = 'polygon(0% 0%, 100% 0%, 100% 66%, 0% 30%)'
const BODY_CLIP = 'polygon(0% 30%, 100% 66%, 100% 100%, 0% 100%)'

export default function PackOpener({ initialPacks, initialPityCounter, cardBack }: {
    initialPacks:        number
    initialPityCounter:  number
    cardBack:            number
}) {
    const [packsLeft, setPacksLeft]             = useState(initialPacks)
    const [pityCounter, setPityCounter]         = useState(initialPityCounter)
    const [phase, setPhase]                     = useState<Phase>('choosing')
    // [] au premier rendu (serveur + hydratation client) : randomPackSkins() tiré à ce moment
    // donnerait des valeurs différentes entre le HTML serveur et le premier rendu client
    // (mismatch d'hydratation). Le vrai tirage n'a lieu qu'après coup, dans l'effet ci-dessous.
    const [packChoices, setPackChoices]         = useState<PackSkin[]>([])
    const [chosenSkin, setChosenSkin]           = useState<PackSkin | null>(null)
    const [bursting, setBursting]               = useState(false)
    const [cards, setCards]                     = useState<CardFaceData[]>([])
    const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set())
    const [zoomedIndex, setZoomedIndex]         = useState<number | null>(null)
    const [unlockedCardBacks, setUnlockedCardBacks] = useState<number[]>([])
    const [error, setError]                     = useState('')
    const [granting, setGranting]               = useState(false)
    const [clearing, setClearing]               = useState(false)
    const { playFlip }                          = useAudio()

    useEffect(() => {
        // Tirage aléatoire volontairement différé après le montage (pas dans le lazy initializer
        // du useState ci-dessus) : c'est le correctif standard React pour un contenu non
        // déterministe rendu par un Client Component encore server-rendu au premier passage —
        // sans ça, le HTML serveur et le premier rendu client divergent (hydration mismatch).
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPackChoices(randomPackSkins(3))
    }, [])

    // Choisir un des 3 paquets proposés déclenche directement l'ouverture — pas d'étape "idle"
    // intermédiaire, le choix EST le clic d'ouverture.
    async function openPack(skin: PackSkin) {
        if (packsLeft <= 0 || phase !== 'choosing') return

        setError('')
        setChosenSkin(skin)
        setBursting(false)
        setPhase('opening')

        const minShakeDelay = new Promise(resolve => setTimeout(resolve, 600))
        const [res] = await Promise.all([
            fetch('/api/packs/open', { method: 'POST' }),
            minShakeDelay,
        ])

        if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            setError(body.error ?? "Unable to open this pack")
            setPhase('choosing')
            return
        }

        const data: { cards: CardFaceData[]; unopenedPacks: number; pityCounter: number; unlockedCardBacks: number[] } = await res.json()

        setCards(data.cards)
        setPacksLeft(data.unopenedPacks)
        setPityCounter(data.pityCounter)
        setRevealedIndices(new Set())
        setUnlockedCardBacks(data.unlockedCardBacks)

        // Le paquet se déchire (le coin haut-droit part, le reste s'affaisse) avant de céder la
        // place au cercle de cartes, plutôt qu'une coupure nette entre l'animation et la révélation.
        setBursting(true)
        await new Promise(resolve => setTimeout(resolve, 450))
        setPhase('revealing')
    }

    // playFlip() ici plutôt que dans le updater de setRevealedIndices : l'appelant (selectCard)
    // garantit déjà que la carte n'est pas encore révélée avant d'appeler revealCard — un effet
    // de bord dans un updater serait dupliqué par le double-appel du StrictMode en dev.
    function revealCard(index: number) {
        playFlip()
        setRevealedIndices(prev => {
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

    // Retour à l'écran de choix (depuis "Back" ou après avoir tout révélé) : 3 nouveaux designs
    // tirés au sort — un choix est de nouveau requis avant la prochaine ouverture.
    function backToChoosing() {
        setPhase('choosing')
        setPackChoices(randomPackSkins(3))
        setChosenSkin(null)
        setCards([])
        setRevealedIndices(new Set())
        setZoomedIndex(null)
        setUnlockedCardBacks([])
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

    async function clearCollection() {
        setClearing(true)
        await fetch('/api/collection/clear', { method: 'POST' })
        setClearing(false)
    }

    const allRevealed         = cards.length > 0 && revealedIndices.size === cards.length
    const packsUntilLegendary = 5 - pityCounter

    return (
        <div className="relative min-h-screen w-full bg-ink-950">
        {/* pointer-events-none sur le conteneur : le vide autour du texte doit laisser passer le
            clic jusqu'aux paquets/cartes affichés par-dessus — sinon ce conteneur (min-h-screen,
            donc plein écran même sans contenu visible partout) intercepte tout. */}
        <div className="min-h-screen flex flex-col items-center p-6 md:p-10 gap-10 pointer-events-none">
            <RoundedRectangle variant="book-cover-panel" className="w-full max-w-3xl flex items-center justify-between p-4 pointer-events-auto">
                <div>
                    <p className="font-serif text-xs uppercase tracking-[0.25em] text-ink-muted mb-1">The Vault</p>
                    <h1 className="font-display text-3xl font-bold text-ink-text">Pack Opening</h1>
                </div>
                <Link
                    href="/"
                    className="rounded-lg border border-leather-700 bg-ink-900 px-4 py-2 font-display text-sm
                        font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                >
                    ⟵ Menu
                </Link>
            </RoundedRectangle>

            <div className="text-center pointer-events-auto">
                <p className="font-serif text-parchment-300/70">
                    {packsLeft} pack{packsLeft !== 1 ? 's' : ''} available
                    {' · '}
                    <span className="text-gold-400">
                        {packsUntilLegendary} pack{packsUntilLegendary !== 1 ? 's' : ''} until guaranteed legendary
                    </span>
                </p>
                {/* Boutons temporaires en attendant un vrai mode de jeu (gagner des paquets) et
                    un vrai flux de test/reset (vider la collection) */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                    <button
                        onClick={grantFreePack}
                        disabled={granting}
                        className="rounded-full border border-leather-700 bg-ink-900 px-3 py-1.5 font-serif text-xs
                            text-parchment-300/70 transition-colors hover:bg-ink-800 disabled:opacity-40"
                    >
                        ✦ {granting ? 'Adding...' : 'Get a free pack (temporary)'}
                    </button>
                    <button
                        onClick={clearCollection}
                        disabled={clearing}
                        className="rounded-full border border-leather-700 bg-ink-900 px-3 py-1.5 font-serif text-xs
                            text-parchment-300/70 transition-colors hover:bg-ink-800 disabled:opacity-40"
                    >
                        🗑 {clearing ? 'Clearing...' : 'Clear collection (temporary)'}
                    </button>
                </div>

                {phase === 'choosing' && (
                    <p className="mt-4 font-serif text-sm italic text-parchment-300/50">
                        {packsLeft > 0 ? 'Choose a pack to open it' : 'No packs available'}
                    </p>
                )}
            </div>

            {error && <p className="pointer-events-auto font-serif text-red-400">{error}</p>}

            {phase === 'choosing' && packsLeft > 0 && packChoices.length > 0 && (
                <div className="flex flex-1 items-center justify-center">
                    <PackChoice skins={packChoices} onChoose={openPack} />
                </div>
            )}
        </div>

        {phase === 'opening' && chosenSkin && (
            <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
                <div className={`relative ${bursting ? '' : 'animate-pack-shake'}`}>
                    {bursting && (
                        <div className="absolute inset-0 -m-8 animate-pack-flash rounded-full bg-gold-300/40 blur-2xl" />
                    )}
                    {/* Avant l'éclatement : un seul PackArt entier, pas de découpe visible — la
                        déchirure (deux moitiés en clip-path) n'apparaît qu'au moment du burst. */}
                    {!bursting ? (
                        <PackArt
                            skin={chosenSkin}
                            width={220}
                            className="relative rounded-md border-[3px] border-gold-500/60 shadow-2xl shadow-black/60"
                        />
                    ) : (
                        <>
                            {/* Moitié basse : reste en place, s'affaisse et s'efface. */}
                            <PackArt
                                skin={chosenSkin}
                                width={220}
                                className="relative rounded-md border-[3px] border-gold-500/60 shadow-2xl shadow-black/60 animate-pack-tear-body"
                                style={{ clipPath: BODY_CLIP }}
                            />
                            {/* Moitié haute (le coin déchiré) : posée par-dessus au même endroit,
                                part en vol. */}
                            <PackArt
                                skin={chosenSkin}
                                width={220}
                                className="absolute inset-0 rounded-md border-[3px] border-gold-500/60 animate-pack-tear-flap"
                                style={{ clipPath: FLAP_CLIP }}
                            />
                        </>
                    )}
                </div>
            </div>
        )}

        {phase === 'revealing' && (
            // Cercle sorti du flux normal (fixed, centré sur TOUTE la fenêtre) plutôt que posé
            // dans la colonne sous l'en-tête : sinon la hauteur du bandeau du dessus repousse le
            // cercle vers le bas et ses cartes du bas sortent de l'écran. pointer-events-none :
            // le centre doit laisser passer le clic vers ce qui est affiché par-dessus au même
            // endroit — chaque élément interactif repasse en pointer-events-auto.
            <div className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-6
                bg-ink-950/40 backdrop-blur-md pointer-events-none">
                {/* Colonne de gauche : "Back" visible dès l'ouverture du paquet (pas besoin
                    d'attendre d'avoir tout révélé pour revenir au choix), puis les deux autres
                    boutons juste en dessous une fois tout révélé — plus un rang centré à part. */}
                <div className="pointer-events-auto absolute left-6 top-6 flex flex-col gap-3">
                    <button
                        onClick={backToChoosing}
                        className="rounded-lg border border-leather-700 bg-ink-900 px-4 py-2
                            font-display text-sm font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                    >
                        ⟵ Back
                    </button>

                    {allRevealed && packsLeft > 0 && (
                        <button
                            onClick={backToChoosing}
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

                {unlockedCardBacks.map(index => (
                    <div
                        key={index}
                        className="pointer-events-auto flex items-center gap-3 rounded-lg border border-gold-500/50
                            bg-leather-800 px-4 py-2 shadow"
                    >
                        <CardBackArt index={index} className="h-14 w-11 rounded-sm shrink-0" />
                        <div>
                            <p className="font-display text-sm font-bold text-gold-300">New card back unlocked!</p>
                            <p className="font-serif text-xs text-parchment-300/70">Pick it in your profile</p>
                        </div>
                    </div>
                ))}

                <PackCardCircle
                    cards={cards}
                    revealedIndices={revealedIndices}
                    onSelect={selectCard}
                    cardBack={cardBack}
                />
            </div>
        )}

        <PackCardZoom
            card={zoomedIndex !== null ? cards[zoomedIndex] : null}
            onClose={() => setZoomedIndex(null)}
        />
        </div>
    )
}
