'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import CardFace, { type CardFaceData } from '@/components/CardFace'

type Card = CardFaceData & { ownedQty: number }

const HALF_SIZE       = 6
const CARDS_PER_PAGE   = HALF_SIZE * 2
const FLIP_THRESHOLD   = 0.35
const FLIP_DURATION_MS = 450

function normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// Le champ costNum en base n'est pas fiable (souvent \u00e0 0 m\u00eame quand cost ne l'est pas) :
// on trie donc sur le vrai co\u00fbt affich\u00e9 sur la carte. "X" (co\u00fbt variable) est tri\u00e9 en dernier.
function parseCost(cost: string): number {
    const n = Number(cost)
    return Number.isNaN(n) ? Infinity : n
}

type Side = 'left' | 'right'
type FlipState = { direction: 'next' | 'prev'; progress: number; dragging: boolean }

export default function CollectionBook({ cards }: { cards: Card[] }) {
    const [search, setSearch]   = useState('')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
    const [page, setPage]       = useState(0)
    const [flip, setFlip]       = useState<FlipState | null>(null)

    const bookRef  = useRef<HTMLDivElement>(null)
    const dragInfo = useRef<{ direction: 'next' | 'prev'; startX: number; width: number } | null>(null)

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

    function canGo(direction: 'next' | 'prev'): boolean {
        return direction === 'next' ? currentPage < totalPages - 1 : currentPage > 0
    }

    function updateSearch(value: string) {
        setSearch(value)
        setPage(0)
        setFlip(null)
    }

    function toggleSort() {
        setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        setPage(0)
        setFlip(null)
    }

    function startDrag(direction: 'next' | 'prev') {
        return (e: React.PointerEvent<HTMLDivElement>) => {
            if (flip || !canGo(direction)) return
            const width = (bookRef.current?.offsetWidth ?? 800) / 2
            dragInfo.current = { direction, startX: e.clientX, width }
            setFlip({ direction, progress: 0, dragging: true })
            e.currentTarget.setPointerCapture(e.pointerId)
        }
    }

    function onDragMove(e: React.PointerEvent<HTMLDivElement>) {
        const info = dragInfo.current
        if (!info) return
        const dx  = e.clientX - info.startX
        const raw = info.direction === 'next' ? -dx : dx
        const progress = Math.min(1, Math.max(0, raw / info.width))
        setFlip({ direction: info.direction, progress, dragging: true })
    }

    function endDrag() {
        const info = dragInfo.current
        if (!info || !flip) return
        dragInfo.current = null

        const target = flip.progress > FLIP_THRESHOLD ? 1 : 0
        if (flip.progress === target) {
            // Déjà à la valeur cible (ex : drag allé jusqu'au bout) : le transform ne
            // changera pas, donc aucune transition ne se déclenchera. On valide directement
            // plutôt que d'attendre un onTransitionEnd qui ne viendra jamais.
            if (target === 1) setPage(p => info.direction === 'next' ? p + 1 : p - 1)
            setFlip(null)
        } else {
            setFlip({ ...flip, progress: target, dragging: false })
        }
    }

    function flipToPage(direction: 'next' | 'prev') {
        if (flip || !canGo(direction)) return
        setFlip({ direction, progress: 0, dragging: true })
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setFlip(prev => prev ? { ...prev, progress: 1, dragging: false } : prev)
            })
        })
    }

    function handleTransitionEnd() {
        if (!flip || flip.dragging) return
        if (flip.progress >= 1) {
            setPage(p => flip.direction === 'next' ? p + 1 : p - 1)
        }
        setFlip(null)
    }

    function renderHalf(side: Side) {
        const isTurning = flip !== null && (
            (side === 'right' && flip.direction === 'next') ||
            (side === 'left'  && flip.direction === 'prev')
        )

        const currentHalf = side === 'left' ? pageCards.slice(0, HALF_SIZE) : pageCards.slice(HALF_SIZE)
        const staticHalf  = isTurning
            ? (side === 'left' ? targetCards.slice(0, HALF_SIZE) : targetCards.slice(HALF_SIZE))
            : currentHalf

        const angle  = isTurning && flip ? (side === 'right' ? -1 : 1) * flip.progress * 180 : 0
        const origin = side === 'right' ? 'left center' : 'right center'

        return (
            <div className="relative flex-1 [perspective:2200px]">
                <div className="rounded-2xl border-4 border-leather-800 bg-leather-900 p-3 shadow-2xl">
                    <div
                        key={currentPage}
                        className="paper-texture animate-page-settle relative grid min-h-[620px] grid-cols-2
                            grid-rows-3 gap-4 rounded-xl bg-parchment-100 p-5"
                    >
                        {staticHalf.length === 0 && (
                            <p className="col-span-full self-center text-center font-serif italic text-leather-700">
                                Aucune carte
                            </p>
                        )}
                        {staticHalf.map(card => (
                            <CardFace key={card.id} card={card} ownedQty={card.ownedQty} />
                        ))}
                    </div>
                </div>

                {isTurning && flip && (
                    <div
                        className="absolute inset-0 [transform-style:preserve-3d]"
                        style={{
                            transform:       `rotateY(${angle}deg)`,
                            transformOrigin: origin,
                            transition:      flip.dragging ? 'none' : `transform ${FLIP_DURATION_MS}ms ease`,
                        }}
                    >
                        <div
                            onTransitionEnd={handleTransitionEnd}
                            className="absolute inset-0 rounded-2xl border-4 border-leather-800 bg-leather-900
                                p-3 shadow-2xl [backface-visibility:hidden]"
                        >
                            <div className="paper-texture relative grid min-h-[620px] grid-cols-2 grid-rows-3 gap-4
                                rounded-xl bg-parchment-100 p-5">
                                {currentHalf.map(card => (
                                    <CardFace key={card.id} card={card} ownedQty={card.ownedQty} />
                                ))}
                            </div>
                            <div
                                className="pointer-events-none absolute inset-0 rounded-2xl bg-black"
                                style={{ opacity: Math.min(0.45, flip.progress * 0.6) }}
                            />
                        </div>
                    </div>
                )}

                {side === 'left' && canGo('prev') && (
                    <div
                        onPointerDown={startDrag('prev')}
                        onPointerMove={onDragMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        title="Glisser pour revenir en arrière"
                        className="absolute inset-y-0 left-0 z-30 w-8 cursor-grab touch-none active:cursor-grabbing"
                    />
                )}
                {side === 'right' && canGo('next') && (
                    <div
                        onPointerDown={startDrag('next')}
                        onPointerMove={onDragMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        title="Glisser pour tourner la page"
                        className="absolute inset-y-0 right-0 z-30 w-8 cursor-grab touch-none active:cursor-grabbing"
                    />
                )}
            </div>
        )
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

            {/* Le livre : deux demi-pages autour de la reliure centrale */}
            <div ref={bookRef} className="relative flex w-full max-w-6xl">
                {renderHalf('left')}
                <div className="w-3 shrink-0 bg-gradient-to-r from-black/50 via-leather-950 to-black/50" />
                {renderHalf('right')}
            </div>

            <div className="flex gap-4">
                <button
                    onClick={() => flipToPage('prev')}
                    disabled={!canGo('prev')}
                    className="rounded-lg border border-leather-700 bg-ink-900 px-5 py-2.5 font-display text-sm
                        font-bold text-parchment-100 transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    ⟵ Page précédente
                </button>
                <button
                    onClick={() => flipToPage('next')}
                    disabled={!canGo('next')}
                    className="rounded-lg border border-leather-700 bg-ink-900 px-5 py-2.5 font-display text-sm
                        font-bold text-parchment-100 transition-colors hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-30"
                >
                    Page suivante ⟶
                </button>
            </div>
        </div>
    )
}
