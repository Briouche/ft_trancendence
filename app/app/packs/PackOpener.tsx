'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PackCardCircle from './PackCardCircle'
import PackCardZoom from './PackCardZoom'
import PackChoice from './PackChoice'
import PackArt, { randomPackSkins, type PackSkin } from './PackArt'
import CardBackArt from '@/components/CardBackArt'
import type { CardFaceData } from '@/components/CardFace'
import { outlinedWhiteTextStyle, woodenTableBackground } from '@/components/notebook/NotebookUI'
import { HomeButton } from '@/components/notebook/AssetButton'
import { TitleBanner } from '@/components/notebook/PageLayout'
import ScaleToFit from '@/components/ScaleToFit'

type Phase = 'choosing' | 'opening' | 'revealing'

// Tear line of the opening animation: the top-right corner (flap) flies off, the body sags.
const FLAP_CLIP = 'polygon(0% 0%, 100% 0%, 100% 66%, 0% 30%)'
const BODY_CLIP = 'polygon(0% 30%, 100% 66%, 100% 100%, 0% 100%)'

// Pack opening flow: choose one of 3 designs → tear animation while /api/packs/open runs →
// cards revealed one by one in a circle.
export default function PackOpener({ initialPacks, initialPityCounter, cardBack }: {
    initialPacks:        number
    initialPityCounter:  number
    cardBack:            number
}) {
    const [packsLeft, setPacksLeft]             = useState(initialPacks)
    const [pityCounter, setPityCounter]         = useState(initialPityCounter)
    const [phase, setPhase]                     = useState<Phase>('choosing')
    const [packChoices, setPackChoices]         = useState<PackSkin[]>([])
    const [chosenSkin, setChosenSkin]           = useState<PackSkin | null>(null)
    const [bursting, setBursting]               = useState(false)
    const [cards, setCards]                     = useState<CardFaceData[]>([])
    const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set())
    const [zoomedIndex, setZoomedIndex]         = useState<number | null>(null)
    const [unlockedCardBacks, setUnlockedCardBacks] = useState<number[]>([])
    const [error, setError]                     = useState('')
    const router                                = useRouter()

    // Random designs are rolled after mount to keep server and client renders identical.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPackChoices(randomPackSkins(3))
    }, [])

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

    // First click flips the card in place; a second click zooms it.
    function selectCard(index: number) {
        if (revealedIndices.has(index)) {
            setZoomedIndex(index)
        } else {
            revealCard(index)
        }
    }

    // Space reveals the next face-down card.
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

    function backToChoosing() {
        setPhase('choosing')
        setPackChoices(randomPackSkins(3))
        setChosenSkin(null)
        setCards([])
        setRevealedIndices(new Set())
        setZoomedIndex(null)
        setUnlockedCardBacks([])
    }

    const allRevealed         = cards.length > 0 && revealedIndices.size === cards.length
    const packsUntilLegendary = 5 - pityCounter

    return (
        <div className="relative min-h-screen w-full" style={woodenTableBackground}>
        <HomeButton onClick={() => router.push('/')} />
        <ScaleToFit className="h-screen pt-10 pointer-events-none" maxScale={1.3} align="start">
            <div className="flex flex-col items-center gap-6">
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
        </ScaleToFit>

        {phase === 'opening' && chosenSkin && (
            <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center">
                <div className={`relative ${bursting ? '' : 'animate-pack-shake'}`}>
                    {bursting && (
                        <div className="absolute inset-0 -m-8 animate-pack-flash rounded-full bg-gold-300/40 blur-2xl" />
                    )}
                    {!bursting ? (
                        <PackArt
                            skin={chosenSkin}
                            width={220}
                            className="relative rounded-md border-[3px] border-gold-500/60 shadow-2xl shadow-black/60"
                        />
                    ) : (
                        <>
                            <PackArt
                                skin={chosenSkin}
                                width={220}
                                className="relative rounded-md border-[3px] border-gold-500/60 shadow-2xl shadow-black/60 animate-pack-tear-body"
                                style={{ clipPath: BODY_CLIP }}
                            />
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
            <div className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-6
                bg-ink-950/40 backdrop-blur-md pointer-events-none">
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
