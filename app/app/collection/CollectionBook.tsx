'use client'

import { useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { type CardFaceData } from '@/components/CardFace'
import SceneLoading from '@/components/library/SceneLoading'
import CardZoom from './CardZoom'
import RoundedRectangle from '@/components/elements/RoundedRectangle'

const BookScene = dynamic(() => import('./BookScene'), { ssr: false, loading: SceneLoading })

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

const COST_FILTERS = [0, 1, 2, 3, 4, 5, 6, 7]

export default function CollectionBook({ cards }: { cards: Card[] }) {
    const [search, setSearch]         = useState('')
    const [sortBy, setSortBy]         = useState<'cost' | 'name'>('cost')
    const [sortDir, setSortDir]       = useState<'asc' | 'desc'>('asc')
    const [costFilter, setCostFilter] = useState<number | null>(null)
    const [page, setPage]             = useState(0)
    const [flip, setFlip]             = useState<FlipState>(null)
    const [zoomedCard, setZoomedCard] = useState<Card | null>(null)

    const dragStart = useRef<{ direction: 'next' | 'prev' } | null>(null)
    const settleRaf  = useRef<number | null>(null)

    const filtered = useMemo(() => {
        const query = normalize(search.trim())
        let matches = query === ''
            ? cards
            : cards.filter(c => normalize(c.name).includes(query) || normalize(c.desc).includes(query))

        if (costFilter !== null) {
            matches = matches.filter(c => parseCost(c.cost) === costFilter)
        }

        return [...matches].sort((a, b) => {
            if (sortBy === 'name') {
                return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
            }
            return sortDir === 'asc' ? parseCost(a.cost) - parseCost(b.cost) : parseCost(b.cost) - parseCost(a.cost)
        })
    }, [cards, search, sortBy, sortDir, costFilter])

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
    // La pile fixe du côté qui tourne (ex: la droite pendant un "next") est en réalité déjà la
    // page suivante en dessous, juste cachée par la page qu'on est en train de tourner — dans un
    // vrai livre ce contenu ne "charge" pas après coup. Sans ça, cette pile continuait d'afficher
    // l'ancienne page pendant toute l'animation, et le changement n'apparaissait qu'au tout
    // dernier instant (d'où l'impression que l'ancienne page reste ~1s et que la suivante met du
    // temps à s'afficher).
    const revealCards = flip
        ? (flip.direction === 'next' ? targetCards.slice(HALF_SIZE) : targetCards.slice(0, HALF_SIZE))
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

    // Recliquer le même critère inverse juste sa direction ; changer de critère repart en asc.
    function selectSort(criteria: 'cost' | 'name') {
        if (sortBy === criteria) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(criteria)
            setSortDir('asc')
        }
        setPage(0)
        resetFlip()
    }

    function toggleCostFilter(value: number) {
        setCostFilter(f => f === value ? null : value)
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
        <div className="relative min-h-screen">
            {/* Le livre occupe toute la page (fond plein écran, fixed) — c'est lui la page,
                pas un élément posé dedans. L'UI flotte par-dessus en overlay. */}
            <BookScene
                leftCards={leftCards}
                rightCards={rightCards}
                backCards={backCards}
                revealCards={revealCards}
                flip={flip}
                canGoPrev={canGo('prev')}
                canGoNext={canGo('next')}
                onFlipStart={onFlipStart}
                onFlipMove={onFlipMove}
                onFlipEnd={onFlipEnd}
                onCardClick={setZoomedCard}
            />

            <CardZoom card={zoomedCard} onClose={() => setZoomedCard(null)} />

            {/* pointer-events-none sur le conteneur : le vide autour des contrôles laisse passer
                les clics/glissés vers le livre en dessous ; chaque contrôle repasse en auto. */}
            <div className="relative z-10 flex flex-col items-center gap-4 p-6 md:p-10 pointer-events-none">
                <div className="w-full max-w-6xl flex items-center justify-between gap-4 rounded-xl
                    bg-ink-950/80 backdrop-blur-sm p-5 pointer-events-auto">
                    <RoundedRectangle variant="book-cover-panel" className="px-4 py-2">
                        <h1 className="font-display text-3xl font-bold text-ink-text tracking-wide">
                            Card Grimoire
                        </h1>
                        <p className="font-serif text-sm italic text-ink-muted mt-1">
                            {filtered.length} card{filtered.length !== 1 ? 's' : ''} · page {currentPage + 1} / {totalPages}
                        </p>
                    </RoundedRectangle>

                    {/* Filtre par coût exact, à côté du titre plutôt qu'en dessous (gagne de la
                        hauteur) : cliquer une case n'affiche que les cartes de ce coût-là ;
                        recliquer la même case retire le filtre. */}
                    <div className="flex flex-wrap items-center gap-1.5">
                        {COST_FILTERS.map(value => (
                            <button
                                key={value}
                                onClick={() => toggleCostFilter(value)}
                                aria-pressed={costFilter === value}
                                className={`flex h-8 w-8 items-center justify-center rounded-lg border font-display text-sm font-bold transition-colors
                                    ${costFilter === value
                                        ? 'border-gold-400 bg-gold-500 text-ink-950'
                                        : 'border-leather-700 bg-ink-900 text-parchment-300/70 hover:bg-ink-800'}`}
                            >
                                {value}
                            </button>
                        ))}
                        {costFilter !== null && (
                            <button
                                onClick={() => toggleCostFilter(costFilter)}
                                className="ml-1 font-serif text-xs text-parchment-300/50 underline hover:text-parchment-100"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    <Link
                        href="/"
                        className="rounded-lg border border-gold-500/40 bg-leather-900 px-4 py-2 font-display text-sm
                            font-bold text-parchment-100 shadow transition-colors hover:bg-leather-800"
                    >
                        ⟵ Menu
                    </Link>
                </div>

                <div className="w-full max-w-6xl flex flex-wrap gap-3 pointer-events-auto">
                    <input
                        type="text"
                        value={search}
                        onChange={e => updateSearch(e.target.value)}
                        placeholder="Search a name or an effect..."
                        className="flex-1 min-w-[220px] rounded-lg border border-leather-700 bg-ink-900 px-4 py-2
                            font-serif text-sm text-parchment-100 placeholder:text-parchment-300/40 outline-none
                            focus:ring-2 focus:ring-gold-500"
                    />
                    {/* Tri : recliquer le même bouton inverse juste sa direction. */}
                    <button
                        onClick={() => selectSort('cost')}
                        className={`whitespace-nowrap rounded-lg border px-4 py-2 font-display text-sm font-bold transition-colors
                            ${sortBy === 'cost'
                                ? 'border-gold-500/60 bg-leather-800 text-parchment-100'
                                : 'border-leather-700 bg-ink-900 text-parchment-300/70 hover:bg-ink-800'}`}
                    >
                        ◆ Cost {sortBy === 'cost' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                    <button
                        onClick={() => selectSort('name')}
                        className={`whitespace-nowrap rounded-lg border px-4 py-2 font-display text-sm font-bold transition-colors
                            ${sortBy === 'name'
                                ? 'border-gold-500/60 bg-leather-800 text-parchment-100'
                                : 'border-leather-700 bg-ink-900 text-parchment-300/70 hover:bg-ink-800'}`}
                    >
                        A–Z {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                    </button>
                </div>
            </div>
        </div>
    )
}
