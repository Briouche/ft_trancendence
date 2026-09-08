'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { getEffectiveVolume } from '@/lib/audioSettings'

// Shared UI pieces used by every "notebook page" on the site (Collection, Deck Builder...) —
// sourced from the notebook (03_NoteBook) asset in the Complete UI Book Styles Pack. Extracted
// from CollectionBook.tsx to be reused as-is instead of duplicated.

// Module-level instance reused on every page turn (PageArrow below) instead of a `new Audio()`
// per click: avoids re-creating/re-loading the file on every call. `currentTime = 0` lets the
// sound restart even if the previous click's playback hasn't finished (rapid clicks). Volume is
// re-read on every play (not cached): reflects a Settings change made while the book is already
// open immediately, with no need to subscribe to anything.
let pageFlipAudio: HTMLAudioElement | null = null

function playPageFlip(): void {
    if (!pageFlipAudio)
        pageFlipAudio = new Audio('/sounds/page-flip.m4a')
    pageFlipAudio.volume = getEffectiveVolume('ambience')
    pageFlipAudio.currentTime = 0
    pageFlipAudio.play().catch(() => {})
}

// Cycles through `count` frames every `intervalMs`, as long as `playing` is true (falls back to
// frame 1 otherwise) — used by every "Sprites Animated" notebook animation (selection, arrows)
// that needs to loop continuously rather than play once. requestAnimationFrame (real elapsed
// time) instead of setInterval: a timer running off the display's rhythm forces renders that
// either land mid-already-painted-frame (wasted) or pile up, whereas rAF only does work once per
// frame actually displayed — smoother AND less work.
export function useLoopFrame(count: number, intervalMs: number, playing: boolean): number {
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
        // The reset to frame 1 happens in the cleanup (not the effect body): calling setState
        // directly in the body triggers cascading renders (react-hooks/set-state-in-effect rule)
        // — the cleanup already runs every time `playing` flips back to false or the component
        // unmounts, so it's equivalent.
        return () => { cancelAnimationFrame(rafId); frameRef.current = 1; setFrame(1) }
    }, [playing, count, intervalMs])
    return frame
}

// Highlight frame (card hover, equipped card back, active button) — 4 "Select01a" notebook
// frames (a subtle pulse on the 4 corners). `animate` only loops during an actual hover: a
// persistent state (equipped card back, "active" button) stays displayed but frozen on frame 1
// while the mouse isn't over it — animations should only trigger on hover, not stay continuously
// active for a plain state.
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

// 4 slots per sheet (2×2 grid) × 2 pages = 8 per page turn.
export const HALF = 4
export const SLOTS_PER_PAGE = HALF * 2

export function normalize(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

// The old costNum DB field was never reliable (always 0, never written by the seed — removed
// from the schema): sorting is done on the actual cost displayed on the card instead. "X"
// (variable cost) sorts last.
export function parseCost(cost: string): number {
    const n = Number(cost)
    return Number.isNaN(n) ? Infinity : n
}

// The site's pixel font only ships one weight (no real "Bold" file): font-bold alone is barely
// visible on it. A slight same-color text-shadow in the 4 directions artificially thickens the
// glyph for an actual bold effect, same trick as the numbers on CardFace's icons.
export const boldNumberStyle = {
    textShadow: '1px 0 0 currentColor, -1px 0 0 currentColor, 0 1px 0 currentColor, 0 -1px 0 currentColor',
}

// Same idea as the title's black outline (TitleBanner) — white + 4-direction black outline, just
// thinner (1px instead of 2px) to stay legible at button size rather than a giant title's.
export const outlinedWhiteTextStyle = {
    textShadow: [
        '-1px -1px 0 #000', '1px -1px 0 #000', '-1px 1px 0 #000', '1px 1px 0 #000',
        '-1px 0 0 #000', '1px 0 0 #000', '0 -1px 0 #000', '0 1px 0 #000',
    ].join(', '),
}

// Custom scrollbar ("Bar01a" rotated vertical + "BarHandle02a") — modern browsers render
// scrollbars in "overlay" mode by default, which fully ignores ::-webkit-scrollbar image
// styling. The native scrollbar is therefore kept hidden
// (.notebook-scroll-hidden, see globals.css) and replaced by this JS-driven handle — position
// derived from scrollTop/scrollHeight, dragging included.
// Fixed-size square handle (not stretched to the visible/total ratio like a real scrollbar) —
// "BarHandle02a" is a square icon; stretching it vertically to represent the scroll ratio
// deformed it into a long rectangle. It just slides along the track instead.
const THUMB_SIZE_PX = 30

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

    // Content (deck/card count) can change the scroll height without necessarily firing a scroll
    // event — ResizeObserver recomputes the handle in that case (e.g. deleting a deck).
    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        updateThumb()
        const observer = new ResizeObserver(updateThumb)
        observer.observe(el)
        return () => observer.disconnect()
    }, [updateThumb, children])

    // Delta computed from the starting position (clientY - startY) rather than event.movementY:
    // movementY stays at 0 for synthetic mousemove events (automated tests, some browsers),
    // whereas an absolute delta works regardless of the event's source.
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

// A sheet's slot: highlighted with the notebook's "select" asset on hover (no click needed to
// see the selected state). null = empty cell (keeps the 3×2 grid always fully occupied visually,
// even at the end of a list) — the book should never change size based on how many cards are
// shown on the page.
// `onContextMenu` (right-click, Deck Builder: removes a card) stays active even when `disabled`
// is true (you can no longer ADD one, but you should still be able to remove one) — so only
// `empty` natively disables the button; `disabled` now only blocks the left click and changes the
// cursor. Dimming the whole stack was removed from here: each card (Deck Builder) now dims its
// own layers (front/back) individually, see ScaledCardFace.
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

// Button press animation: 4 "Button01a" frames (notebook Sprites Animated — released → pressed),
// played once on click then back to frame 1, same idea as the earlier TravelBook (just 4 frames
// instead of 5).
const BUTTON_FRAME_MS = 35
const BUTTON_FRAMES = 4

// `variant` picks the texture (Sprites Animated) under the button: "square" (Button01a, the
// generic orange Home-button look, meant for a separate square icon passed as a child) stays the
// default; "bar" (Button03a) is reserved for full-width text buttons (Create/Save deck) so they
// don't reuse the exact Home button look — its text then switches to white with a black outline
// (outlinedWhiteTextStyle), like the title. The other variants come from the 01_TravelBook asset
// (Sprites Animated ButtonHome01a/ButtonBack01a/ButtonManual01a/ButtonAbout01a/ButtonSetting01a/
// ButtonAchievement01a): unlike "square", the icon is already painted into the texture itself —
// no child needed for them.
const SELF_CONTAINED_VARIANTS = ['home', 'back', 'manual', 'about', 'music', 'achievement'] as const
type AssetButtonVariant = 'square' | 'bar' | (typeof SELF_CONTAINED_VARIANTS)[number]

const VARIANT_TEXTURE_PATH: Record<AssetButtonVariant, string> = {
    square:      '/textures/notebook/button',
    bar:         '/textures/notebook/button-bar',
    home:        '/textures/notebook/button-home',
    back:        '/textures/notebook/button-back',
    manual:      '/textures/notebook/button-manual',
    about:       '/textures/notebook/button-about',
    music:       '/textures/notebook/button-music',
    achievement: '/textures/notebook/button-achievement',
}

export function AssetButton({ active, onClick, disabled, variant = 'square', className = '', children }: {
    active?: boolean
    onClick?: () => void
    disabled?: boolean
    variant?: AssetButtonVariant
    className?: string
    children?: React.ReactNode
}) {
    const [frame, setFrame] = useState(1)
    const [hovered, setHovered] = useState(false)
    const texturePath = VARIANT_TEXTURE_PATH[variant]

    // Preloads all 4 frames on mount so they're already cached by the first click — fetching
    // frame 2/3/4 on demand at click time would show a flash of empty/white background for the
    // length of that request. new window.Image() (not the next/image Image component imported
    // above under the same name): the native DOM constructor, used only to trigger the fetch,
    // renders nothing on screen.
    useEffect(() => {
        for (let i = 1; i <= BUTTON_FRAMES; i++) {
            const img = new window.Image()
            img.src = `${texturePath}/frame-${i}.webp`
        }
    }, [texturePath])

    // onClick fires after the animation cycle completes, not at click time, because for home/
    // back/manual the action (navigation, back to the selection screen) unmounts or hides the
    // button immediately — firing onClick right away would skip frames 2/3/4 entirely.
    // Recursively rescheduled setTimeout instead of setInterval: a setInterval started from a
    // click handler can silently stop delivering ticks, whereas each setTimeout only schedules
    // its next tick after the current one has run, so there's no queued tick that can get lost.
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
            onClick={handleClick}
            disabled={disabled}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`relative flex items-center justify-center font-display font-bold
                transition-opacity disabled:opacity-30 ${variant === 'bar' ? 'text-white' : 'text-ink-text'} ${className}`}
            style={{
                backgroundImage: `url(${texturePath}/frame-${frame}.webp)`,
                backgroundSize: '100% 100%',
                imageRendering: 'pixelated',
            }}
        >
            {active && <SelectHighlight className="-inset-1" animate={hovered} />}
            <span className="relative" style={variant === 'bar' ? outlinedWhiteTextStyle : undefined}>{children}</span>
        </button>
    )
}

// Page-turn arrow: no button chrome (background + frame) — just the notebook's "Arrow01a" icon
// (Sprites Animated, 4 frames), looping while the mouse is near the book's edge, fully invisible
// otherwise (not just faded — it should appear ONLY when the mouse is over it). The icon stays
// exactly at its original spot (w-20, centered, not offset) — only the HIT ZONE is enlarged, via
// a separate invisible layer (w-16) that overlaps the page edge; hover state is shared between
// the two (onMouseEnter/Leave on the wrapper). Points left natively: "prev" isn't flipped, "next"
// is (scaleX(-1)).
export function PageArrow({ direction, onClick, disabled }: {
    direction: 'prev' | 'next'
    onClick: () => void
    disabled: boolean
}) {
    const [hovered, setHovered] = useState(false)
    const frame = useLoopFrame(4, 110, hovered && !disabled)

    function handleClick() {
        playPageFlip()
        onClick()
    }

    return (
        <div
            className="relative flex h-full shrink-0 items-stretch"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Extended, invisible hit layer overlapping the page edge — doesn't move the icon,
                just the zone that triggers hover/click. */}
            <button
                onClick={disabled ? undefined : handleClick}
                disabled={disabled}
                aria-hidden="true"
                tabIndex={-1}
                className={`absolute top-0 z-30 h-full w-16 ${direction === 'prev' ? 'left-full' : 'right-full'}`}
            />
            <button
                onClick={handleClick}
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

// Search field isolated in its own component, with its own LOCAL state: types on screen
// immediately (no perceived latency), but only bubbles the value up to the parent (which
// triggers filtering + a re-render of the whole card grid) 150ms after the last keystroke. This
// keeps every keystroke's re-render scoped to this small input — bubbling the raw value up
// immediately would re-render the whole parent (grid included) regardless of any debouncing on
// the parent's side, since debouncing the computation doesn't shrink the component that
// re-renders on every keystroke.
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

// Wooden table background + dark overlay, shared by every notebook page.
export const woodenTableBackground: React.CSSProperties = {
    backgroundImage: [
        'linear-gradient(rgba(10,8,6,0.55), rgba(10,8,6,0.55))',
        'url(/textures/collection/wooden-table.webp)',
    ].join(', '),
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundColor: '#0e0f10',
}

// "Menu"/Home button fixed to the top-right of the page — independent from the title/book
// centering below. AssetButton's base classes already set "relative", which would win over a
// "fixed" passed via className (Tailwind's generated position classes follow a fixed internal
// order, not source-code order): positioning is therefore applied to a wrapper around the
// button, not the button itself. variant="home" (ButtonHome01a, 01_TravelBook) instead of the
// old generic square + separate icon: the house icon is already painted into the texture.
export function HomeButton({ onClick }: { onClick: () => void }) {
    return (
        <div className="fixed right-6 top-6 z-40">
            <AssetButton onClick={onClick} variant="home" className="h-14 w-14 shrink-0" />
        </div>
    )
}

// Title ribbon banner ("Banner01a"), centered relative to the book below it. `width` (arbitrary
// Tailwind class) and `className` (margins, e.g. vertical offset) let a page tweak it without
// affecting other usages.
export function TitleBanner({ children, width = 'w-[1060px]', className = '' }: { children: React.ReactNode; width?: string; className?: string }) {
    return (
        <div className={`flex ${width} flex-col items-center gap-1 ${className}`}>
            <div className="travelbook-title-banner flex w-full items-center justify-center px-12 py-6">
                {/* White + black outline (4-direction text-shadow, like the card numbers) rather
                    than the brown ink-text: unreadable at this size on the ribbon's cream/orange
                    background. translateY(-25px): the ribbon's flat band (where the text must
                    fit) sits higher than the whole sprite's geometric center — the folded tails
                    hanging at the bottom weigh down the image's bottom without being part of the
                    text area. */}
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
