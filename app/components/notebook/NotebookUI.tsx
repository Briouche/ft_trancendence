'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'

// Shared building blocks of the "notebook" pages (Collection, Deck Builder, Play, Manual...).

// Loops over `count` sprite frames every `intervalMs` while `playing`; rests on frame 1 otherwise.
function useLoopFrame(count: number, intervalMs: number, playing: boolean): number {
    const [frame, setFrame] = useState(1)
    const frameRef = useRef(1)
    useEffect(() => {
        if (!playing) return
        let rafId: number
        let last = performance.now()
        function tick(now: number) {
            if (now - last >= intervalMs) {
                last = now
                frameRef.current = (frameRef.current % count) + 1
                setFrame(frameRef.current)
            }
            rafId = requestAnimationFrame(tick)
        }
        rafId = requestAnimationFrame(tick)
        return () => { cancelAnimationFrame(rafId); frameRef.current = 1; setFrame(1) }
    }, [playing, count, intervalMs])
    return frame
}

// Golden selection frame; pulses only while `animate` is true.
export function SelectHighlight({ className = '', animate = true }: { className?: string; animate?: boolean }) {
    const frame = useLoopFrame(4, 150, animate)
    return (
        <div
            className={`pointer-events-none absolute ${className}`}
            style={{
                borderStyle: 'solid',
                borderWidth: 14,
                borderImageSource: `url(/textures/notebook/select/frame-${frame}.webp)`,
                borderImageSlice: '36',
                borderImageWidth: '14px',
                borderImageRepeat: 'stretch',
                imageRendering: 'pixelated',
            }}
        />
    )
}

// Card slots per page half (2×2) and per two-page spread.
export const HALF = 4
export const SLOTS_PER_PAGE = HALF * 2

export function normalize(value: string): string {
    return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// Numeric cost for sorting; non-numeric ("X") sorts last.
export function parseCost(cost: string): number {
    const n = Number(cost)
    return Number.isNaN(n) ? Infinity : n
}

// Fake bold for the single-weight pixel font.
export const boldNumberStyle = {
    textShadow: '1px 0 0 currentColor, -1px 0 0 currentColor, 0 1px 0 currentColor, 0 -1px 0 currentColor',
}

// White text with a 1px black outline.
export const outlinedWhiteTextStyle = {
    textShadow: [
        '-1px -1px 0 #000', '1px -1px 0 #000', '-1px 1px 0 #000', '1px 1px 0 #000',
        '-1px 0 0 #000', '1px 0 0 #000', '0 -1px 0 #000', '0 1px 0 #000',
    ].join(', '),
}

const THUMB_SIZE_PX = 30

// Scroll container with a sprite scrollbar (square draggable handle on a track).
export function NotebookScrollArea({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [thumb, setThumb] = useState<{ top: number } | null>(null)
    const dragRef = useRef<{ startY: number; startScrollTop: number } | null>(null)

    const updateThumb = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        const { scrollTop, scrollHeight, clientHeight } = el
        if (scrollHeight <= clientHeight + 1) { setThumb(null); return }
        const maxTop = Math.max(0, clientHeight - THUMB_SIZE_PX)
        const top = maxTop === 0 ? 0 : (scrollTop / (scrollHeight - clientHeight)) * maxTop
        setThumb({ top })
    }, [])

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        updateThumb()
        const observer = new ResizeObserver(updateThumb)
        observer.observe(el)
        return () => observer.disconnect()
    }, [updateThumb, children])

    function onThumbPointerDown(e: React.PointerEvent<HTMLDivElement>) {
        const el = scrollRef.current
        if (!el) return
        dragRef.current = { startY: e.clientY, startScrollTop: el.scrollTop }
        e.currentTarget.setPointerCapture(e.pointerId)
    }
    function onThumbPointerMove(e: React.PointerEvent<HTMLDivElement>) {
        const el = scrollRef.current
        const drag = dragRef.current
        if (!el || !drag) return
        const maxTop = Math.max(1, el.clientHeight - THUMB_SIZE_PX)
        const deltaY = e.clientY - drag.startY
        el.scrollTop = drag.startScrollTop + (deltaY / maxTop) * (el.scrollHeight - el.clientHeight)
    }
    function onThumbPointerUp() { dragRef.current = null }

    return (
        <div className={`relative min-h-0 ${className}`}>
            <div ref={scrollRef} onScroll={updateThumb} className="notebook-scroll-hidden h-full overflow-y-auto pr-3">
                {children}
            </div>
            {thumb && (
                <>
                    <div
                        className="pointer-events-none absolute right-0 top-0 h-full w-4"
                        style={{
                            backgroundImage: 'url(/textures/notebook/scrollbar-track.webp)',
                            backgroundSize: '100% 100%',
                            imageRendering: 'pixelated',
                        }}
                    />
                    <div
                        onPointerDown={onThumbPointerDown}
                        onPointerMove={onThumbPointerMove}
                        onPointerUp={onThumbPointerUp}
                        className="absolute right-0 w-4 cursor-grab touch-none active:cursor-grabbing"
                        style={{
                            top: `${thumb.top}px`,
                            height: `${THUMB_SIZE_PX}px`,
                            backgroundImage: 'url(/textures/notebook/scrollbar-thumb.webp)',
                            backgroundSize: '100% 100%',
                            imageRendering: 'pixelated',
                        }}
                    />
                </>
            )}
        </div>
    )
}

// Card slot of a page: highlighted on hover, dashed placeholder when empty. Right-click stays
// available while `disabled` (used to remove a card from a deck).
export function Slot({ children, onClick, onContextMenu, highlighted, disabled }: {
    children?: React.ReactNode
    onClick?: () => void
    onContextMenu?: () => void
    highlighted?: boolean
    disabled?: boolean
}) {
    const [hovered, setHovered] = useState(false)
    const empty = !children

    return (
        <button
            onMouseEnter={() => !empty && setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={empty || disabled ? undefined : onClick}
            onContextMenu={empty || !onContextMenu ? undefined : e => { e.preventDefault(); onContextMenu() }}
            disabled={empty}
            className={`relative block aspect-[130/191] w-full text-left ${disabled ? 'cursor-not-allowed' : ''}`}
        >
            {empty ? (
                <div className="h-full w-full rounded-sm border-2 border-dashed border-ink-900/15" />
            ) : (
                <>
                    {(hovered || highlighted) && <SelectHighlight className="-inset-2 z-10" animate={false} />}
                    <div className="relative h-full">{children}</div>
                </>
            )}
        </button>
    )
}

const BUTTON_FRAME_MS = 35
const BUTTON_FRAMES = 4

// Textures under AssetButton; the icon variants (home … achievement) already carry their icon.
type AssetButtonVariant = 'square' | 'home' | 'back' | 'manual' | 'about' | 'achievement'

const VARIANT_TEXTURE_PATH: Record<AssetButtonVariant, string> = {
    square:      '/textures/notebook/button',
    home:        '/textures/notebook/button-home',
    back:        '/textures/notebook/button-back',
    manual:      '/textures/notebook/button-manual',
    about:       '/textures/notebook/button-about',
    achievement: '/textures/notebook/button-achievement',
}

// Sprite button playing a 4-frame press animation; `onClick` fires once the animation ends.
export function AssetButton({ active, onClick, disabled, variant = 'square', className = '', children, ariaLabel, expanded }: {
    active?: boolean
    onClick?: () => void
    disabled?: boolean
    variant?: AssetButtonVariant
    className?: string
    children?: React.ReactNode
    /** Accessible name, required for the icon-only variants (home, back, about…). */
    ariaLabel?: string
    /** For buttons that open a menu: whether it is currently open (aria-expanded). */
    expanded?: boolean
}) {
    const [frame, setFrame] = useState(1)
    const [hovered, setHovered] = useState(false)
    const texturePath = VARIANT_TEXTURE_PATH[variant]

    useEffect(() => {
        for (let i = 1; i <= BUTTON_FRAMES; i++) {
            const img = new window.Image()
            img.src = `${texturePath}/frame-${i}.webp`
        }
    }, [texturePath])

    function handleClick() {
        if (disabled) return
        function tick(i: number) {
            if (i > BUTTON_FRAMES) {
                setFrame(1)
                onClick?.()
                return
            }
            setFrame(i)
            setTimeout(() => tick(i + 1), BUTTON_FRAME_MS)
        }
        setTimeout(() => tick(2), BUTTON_FRAME_MS)
    }

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-expanded={expanded}
            aria-pressed={active}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`relative flex items-center justify-center font-display font-bold
                transition-opacity disabled:opacity-30 text-ink-text ${className}`}
            style={{
                backgroundImage: `url(${texturePath}/frame-${frame}.webp)`,
                backgroundSize: '100% 100%',
                imageRendering: 'pixelated',
            }}
        >
            {active && <SelectHighlight className="-inset-1" animate={hovered} />}
            <span className="relative">{children}</span>
        </button>
    )
}

// Page-turn arrow, visible and animated only while hovered; an invisible layer widens the hit zone.
export function PageArrow({ direction, onClick, disabled }: {
    direction: 'prev' | 'next'
    onClick: () => void
    disabled: boolean
}) {
    const [hovered, setHovered] = useState(false)
    const frame = useLoopFrame(4, 110, hovered && !disabled)

    return (
        <div
            className="relative flex h-full shrink-0 items-stretch"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <button
                onClick={disabled ? undefined : onClick}
                disabled={disabled}
                aria-hidden="true"
                tabIndex={-1}
                className={`absolute top-0 z-30 h-full w-16 ${direction === 'prev' ? 'left-full' : 'right-full'}`}
            />
            <button
                onClick={onClick}
                disabled={disabled}
                className="relative z-30 flex h-full w-20 shrink-0 items-center justify-center disabled:opacity-0"
            >
                <Image
                    src={`/textures/notebook/arrow/frame-${frame}.webp`}
                    alt={direction === 'prev' ? 'Previous page' : 'Next page'}
                    width={12} height={6} unoptimized
                    className="h-7 w-auto transition-opacity"
                    style={{
                        imageRendering: 'pixelated',
                        transform: direction === 'next' ? 'scaleX(-1)' : undefined,
                        opacity: hovered ? 1 : 0,
                    }}
                />
            </button>
        </div>
    )
}

// Text input that reports its value 150ms after the last keystroke.
export function SearchInput({ onChange, disabled, placeholder = 'Search a name or an effect…', className = '' }: {
    onChange: (value: string) => void
    disabled?: boolean
    placeholder?: string
    className?: string
}) {
    const [value, setValue] = useState('')
    useEffect(() => {
        const id = setTimeout(() => onChange(value), 150)
        return () => clearTimeout(id)
    }, [value, onChange])

    return (
        <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            className={className}
        />
    )
}

export const woodenTableBackground: React.CSSProperties = {
    backgroundImage: [
        'linear-gradient(rgba(10,8,6,0.55), rgba(10,8,6,0.55))',
        'url(/textures/collection/wooden-table.webp)',
    ].join(', '),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: '#0e0f10',
}

// Home button pinned to the top-right corner of the page.
export function HomeButton({ onClick }: { onClick: () => void }) {
    return (
        <div className="fixed right-6 top-6 z-40">
            <AssetButton onClick={onClick} variant="home" className="h-14 w-14 shrink-0" ariaLabel="Back to the hub" />
        </div>
    )
}

// Ribbon title banner.
export function TitleBanner({ children, width = 'w-[1060px]', className = '' }: { children: React.ReactNode; width?: string; className?: string }) {
    return (
        <div className={`flex ${width} flex-col items-center gap-1 ${className}`}>
            <div className="travelbook-title-banner flex w-full items-center justify-center px-12 py-6">
                <h1
                    className="font-display text-7xl font-bold tracking-wide text-white"
                    style={{
                        transform: 'translateY(-25px)',
                        textShadow: [
                            '-2px -2px 0 #000', '2px -2px 0 #000', '-2px 2px 0 #000', '2px 2px 0 #000',
                            '-2px 0 0 #000', '2px 0 0 #000', '0 -2px 0 #000', '0 2px 0 #000',
                        ].join(', '),
                    }}
                >
                    {children}
                </h1>
            </div>
        </div>
    )
}
