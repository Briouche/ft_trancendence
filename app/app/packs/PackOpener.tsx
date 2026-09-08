'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PackCardCircle from './PackCardCircle'
import PackCardZoom from './PackCardZoom'
import PackChoice from './PackChoice'
import PackArt, { randomPackSkins, type PackSkin } from './PackArt'
import CardBackArt from '@/components/CardBackArt'
import type { CardFaceData } from '@/components/CardFace'
import { HomeButton, TitleBanner, outlinedWhiteTextStyle, woodenTableBackground } from '@/components/notebook/NotebookUI'

type Phase = 'choosing' | 'opening' | 'revealing'

// Tear angle measured on the "cardRIPfx" sprite (diff between its "intact" frame and the frame
// just before separation): the crack line runs from (0%, 30%) on the left to (100%, 66%) on the
// right. FLAP = the triangle above it (the departing top-right corner); BODY = the rest.
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
    // [] on first render (server + client hydration): calling randomPackSkins() at this point
    // would give different values between the server HTML and the first client render (hydration
    // mismatch). The actual roll only happens afterward, in the effect below.
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
    const [unlockingAll, setUnlockingAll]       = useState(false)
    const router                                = useRouter()

    useEffect(() => {
        // Roll deferred until after mount rather than in the useState initializer above: the
        // standard fix for non-deterministic content in a server-rendered Client Component.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPackChoices(randomPackSkins(3))
    }, [])

    // Choosing one of the 3 offered packs directly triggers opening — no intermediate "idle"
    // step, the choice IS the opening click.
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

        // The pack tears (the top-right corner flies off, the rest sags) before giving way to the
        // card circle, rather than a hard cut between the animation and the reveal.
        setBursting(true)
        await new Promise(resolve => setTimeout(resolve, 450))
        setPhase('revealing')
    }

    function revealCard(index: number) {
        setRevealedIndices(prev => {
            const next = new Set(prev)
            next.add(index)
            return next
        })
    }

    // First click on a still-back-facing card: it flips in place, inside the circle (small),
    // without coming to the foreground. Clicking an already-revealed card again brings it up full
    // size (PackCardZoom), which stays open until a click outside closes it.
    function selectCard(index: number) {
        if (revealedIndices.has(index)) {
            setZoomedIndex(index)
        } else {
            revealCard(index)
        }
    }

    // Spacebar = keyboard equivalent of clicking the next still-face-down card, one at a time
    // (like a click) rather than revealing everything at once. preventDefault: without it Space
    // also scrolls the page in most browsers.
    useEffect(() => {
        if (phase !== 'revealing') return
        function onKeyDown(e: KeyboardEvent) {
            if (e.code !== 'Space') return
            e.preventDefault()
            const nextIndex = cards.findIndex((_, i) => !revealedIndices.has(i))
            if (nextIndex !== -1) revealCard(nextIndex)
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [phase, cards, revealedIndices])

    // Back to the choice screen (from "Back" or after revealing everything): 3 new designs are
    // rolled — a fresh choice is required before the next opening.
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

    async function unlockAllCards() {
        setUnlockingAll(true)
        await fetch('/api/collection/unlock-all', { method: 'POST' })
        setUnlockingAll(false)
        router.refresh()
    }

    const allRevealed         = cards.length > 0 && revealedIndices.size === cards.length
    const packsUntilLegendary = 5 - pityCounter

    return (
        <div className="relative min-h-screen w-full" style={woodenTableBackground}>
        <HomeButton onClick={() => router.push('/')} />
        {/* pointer-events-none: this container is full-screen (min-h-screen) even where there's
            no visible content, so it must let clicks pass through to the packs/cards above it. */}
        <div className="min-h-screen flex flex-col items-center justify-start p-6 md:p-10 gap-6 pointer-events-none">
            <div className="pointer-events-auto">
                <TitleBanner width="w-[700px]">PACK OPENING</TitleBanner>
            </div>

            <div className="pointer-events-auto text-center">
                <p className="font-serif text-sm text-white" style={outlinedWhiteTextStyle}>
                    {packsLeft} pack{packsLeft !== 1 ? 's' : ''} available
                    {' · '}
                    <span className="font-bold">
                        {packsUntilLegendary} pack{packsUntilLegendary !== 1 ? 's' : ''} until guaranteed legendary
                    </span>
                </p>
                {/* Temporary buttons pending a real way to earn packs through gameplay, and a
                    real test/reset flow (clearing or fully unlocking the collection) */}
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
                    <button
                        onClick={unlockAllCards}
                        disabled={unlockingAll}
                        className="rounded-full border border-leather-700 bg-ink-900 px-3 py-1.5 font-serif text-xs
                            text-parchment-300/70 transition-colors hover:bg-ink-800 disabled:opacity-40"
                    >
                        🔓 {unlockingAll ? 'Unlocking...' : 'Unlock all cards (temporary)'}
                    </button>
                </div>

                {phase === 'choosing' && (
                    <p className="mt-4 font-serif text-xs italic text-white/70" style={outlinedWhiteTextStyle}>
                        {packsLeft > 0 ? 'Choose a pack to open it' : "No packs available — you'll still see what's on offer"}
                    </p>
                )}
            </div>

            {error && <p className="pointer-events-auto font-serif text-red-400">{error}</p>}

            {phase === 'choosing' && packChoices.length > 0 && (
                <PackChoice skins={packChoices} locked={packsLeft <= 0} onChoose={openPack} />
            )}
        </div>

        {phase === 'opening' && chosenSkin && (
            <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
                <div className={`relative ${bursting ? '' : 'animate-pack-shake'}`}>
                    {bursting && (
                        <div className="absolute inset-0 -m-8 animate-pack-flash rounded-full bg-gold-300/40 blur-2xl" />
                    )}
                    {/* Before the burst: a single whole PackArt, no visible cut — the tear (two
                        clip-path halves) only appears at the moment of the burst. */}
                    {!bursting ? (
                        <PackArt
                            skin={chosenSkin}
                            width={220}
                            className="relative rounded-md border-[3px] border-gold-500/60 shadow-2xl shadow-black/60"
                        />
                    ) : (
                        <>
                            {/* Bottom half: stays in place, sags and fades out. */}
                            <PackArt
                                skin={chosenSkin}
                                width={220}
                                className="relative rounded-md border-[3px] border-gold-500/60 shadow-2xl shadow-black/60 animate-pack-tear-body"
                                style={{ clipPath: BODY_CLIP }}
                            />
                            {/* Top half (the torn corner): overlaid at the same spot, flies off. */}
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
            // Circle is fixed and centered on the whole window rather than placed under the
            // header, so the header's height doesn't push it down and clip its bottom cards.
            // pointer-events-none here, switched back to auto on each interactive element.
            <div className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-6
                bg-ink-950/40 backdrop-blur-md pointer-events-none">
                {/* No more "Open another pack"/"Back" button here — both end-of-reveal actions
                    (back to choice, go to collection) now live at the center of the circle
                    (PackCardCircle), once everything is revealed. */}
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
                    onBack={backToChoosing}
                    onViewCollection={() => router.push('/collection')}
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
