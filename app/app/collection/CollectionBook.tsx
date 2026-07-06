'use client'

import { useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { type CardFaceData } from '@/components/CardFace'

const BookScene = dynamic(() => import('./BookScene'), { ssr: false })

type Card = CardFaceData & { ownedQty: number }

const HALF_SIZE        = 6
const CARDS_PER_PAGE   = HALF_SIZE * 2
const FLIP_THRESHOLD   = 0.35
const FLIP_DURATION_MS = 550

function normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// Le champ costNum en base n'est pas fiable (souvent à 0 même quand cost ne l'est pas) :
// on trie donc sur le vrai coût affiché sur la carte. "X" (coût variable) est trié en dernier.
function parseCost(cost: string): number {
    const n = Number(cost)
    return Number.isNaN(n) ? Infinity : n
}

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
}

type FlipState = { direction: 'next' | 'prev'; progress: number } | null

export default function CollectionBook({ cards }: { cards: Card[] }) {
    const [search, setSearch]   = useState('')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
    const [page, setPage]       = useState(0)
    const [flip, setFlip]       = useState<FlipState>(null)

    const dragStart = useRef<{ direction: 'next' | 'prev' } | null>(null)
    const settleRaf  = useRef<number | null>(null)

    const filtered = useMemo(() => {
        const query = normalize(search.trim())
        const matches = query === ''
            ? cards
            : cards.filter(c => normalize(c.name).includes(query) || normalize(c.desc).includes(query))

        return [...matches].sort((a, b) =>
            sortDir === 'asc' ? parseCost(a.cost) - parseCost(b.cost) : parseCost(b.cost) - parseCost(a.cost)
        )
    }, [cards, search, sortDir])

    const totalPages  = Math.max(1, Math.ceil(filtered.length / CARDS_PER_PAGE))
    const currentPage = Math.min(page, totalPages - 1)
    const pageCards   = filtered.slice(currentPage * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE + CARDS_PER_PAGE)
    const targetPage  = flip ? currentPage + (flip.direction === 'next' ? 1 : -1) : null
    const targetCards = targetPage !== null
        ? filtered.slice(targetPage * CARDS_PER_PAGE, targetPage * CARDS_PER_PAGE + CARDS_PER_PAGE)
        : []

    const leftCards  = pageCards.slice(0, HALF_SIZE)
    const rightCards = pageCards.slice(HALF_SIZE)
    // Le dos de la page qui tourne montre la moitié cible de l'AUTRE côté (elle finit posée
    // en face, comme une vraie page de livre) : next tourne à droite -> dos = future page gauche.
    const backCards = flip
        ? (flip.direction === 'next' ? targetCards.slice(0, HALF_SIZE) : targetCards.slice(HALF_SIZE))
        : []

    function canGo(direction: 'next' | 'prev'): boolean {
        return direction === 'next' ? currentPage < totalPages - 1 : currentPage > 0
    }

    function stopSettle() {
        if (settleRaf.current !== null) {
            cancelAnimationFrame(settleRaf.current)
            settleRaf.current = null
        }
    }

    function resetFlip() {
        stopSettle()
        dragStart.current = null
        setFlip(null)
    }

    function updateSearch(value: string) {
        setSearch(value)
        setPage(0)
        resetFlip()
    }

    function toggleSort() {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        setPage(0)
        resetFlip()
    }

    // Anime `progress` de sa valeur actuelle vers `target` (0 ou 1) en JS (pas de transition
    // CSS ici : la page est un mesh Three.js), puis avance la page et referme l'état.
    function settleFlip(direction: 'next' | 'prev', from: number, target: 0 | 1) {
        stopSettle()
        const start = performance.now()
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / FLIP_DURATION_MS)
            const progress = from + (target - from) * easeOutCubic(t)
            setFlip({ direction, progress })
            if (t < 1) {
                settleRaf.current = requestAnimationFrame(tick)
            } else {
                settleRaf.current = null
                if (target === 1) setPage(p => direction === 'next' ? p + 1 : p - 1)
                setFlip(null)
            }
        }
        settleRaf.current = requestAnimationFrame(tick)
    }

    function onFlipStart(direction: 'next' | 'prev') {
        if (flip || !canGo(direction)) return
        dragStart.current = { direction }
        setFlip({ direction, progress: 0 })
    }

    function onFlipMove(deltaRatio: number) {
        if (!dragStart.current) return
        const { direction } = dragStart.current
        const raw = direction === 'next' ? -deltaRatio : deltaRatio
        setFlip({ direction, progress: Math.min(1, Math.max(0, raw)) })
    }

    function onFlipEnd() {
        if (!dragStart.current || !flip) return
        const { direction } = dragStart.current
        dragStart.current = null
        // progress===0 : simple clic (aucun glissement) -> on joue quand même le tournage complet.
        const target = (flip.progress === 0 || flip.progress > FLIP_THRESHOLD) ? 1 : 0
        settleFlip(direction, flip.progress, target)
    }

    return (
        <div className="min-h-screen bg-ink-950 flex flex-col items-center p-6 md:p-10 gap-6">
            <div className="w-full max-w-6xl flex items-center justify-between">
                <h1 className="font-display text-3xl font-bold text-parchment-100 tracking-wide">
                    Grimoire des Cartes
                </h1>
                <Link
                    href="/"
                    className="rounded-lg border border-gold-500/40 bg-leather-900 px-4 py-2 font-display text-sm
                        font-bold text-parchment-100 shadow transition-colors hover:bg-leather-800"
                >
                    ⟵ Menu
                </Link>
            </div>

            <div className="w-full max-w-6xl flex flex-wrap gap-3">
                <input
                    type="text"
                    value={search}
                    onChange={e => updateSearch(e.target.value)}
                    placeholder="Rechercher un nom ou un effet..."
                    className="flex-1 min-w-[220px] rounded-lg border border-leather-700 bg-ink-900 px-4 py-2
                        font-serif text-sm text-parchment-100 placeholder:text-parchment-300/40 outline-none
                        focus:ring-2 focus:ring-gold-500"
                />
                <button
                    onClick={toggleSort}
                    className="whitespace-nowrap rounded-lg border border-leather-700 bg-ink-900 px-4 py-2
                        font-display text-sm font-bold text-parchment-100 transition-colors hover:bg-ink-800"
                >
                    ◆ Coût {sortDir === 'asc' ? '↑' : '↓'}
                </button>
            </div>

            <p className="font-serif text-sm italic text-parchment-300/70">
                {filtered.length} carte{filtered.length !== 1 ? 's' : ''} · page {currentPage + 1} / {totalPages}
            </p>

            <div className="w-full max-w-6xl">
                <BookScene
                    leftCards={leftCards}
                    rightCards={rightCards}
                    backCards={backCards}
                    flip={flip}
                    canGoPrev={canGo('prev')}
                    canGoNext={canGo('next')}
                    onFlipStart={onFlipStart}
                    onFlipMove={onFlipMove}
                    onFlipEnd={onFlipEnd}
                />
            </div>
        </div>
    )
}
