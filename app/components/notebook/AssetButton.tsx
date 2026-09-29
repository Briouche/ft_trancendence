'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/config/routes'
import { SelectHighlight } from './NotebookUI'

// Button press animation: 4 "Button01a" frames (notebook Sprites Animated — released → pressed),
// played once on click then back to frame 1, same idea as the earlier TravelBook (just 4 frames
// instead of 5).
const BUTTON_FRAME_MS = 35
const BUTTON_FRAMES = 4

// `variant` picks the texture (Sprites Animated) under the button: "square" is the generic orange
// Home-button look, meant for a separate square icon passed as a child, and stays the default. The
// other variants come from the 01_TravelBook asset (Sprites Animated ButtonHome01a/ButtonBack01a/
// ButtonManual01a/ButtonAbout01a/ButtonAchievement01a): unlike "square", the icon
// is already painted into the texture itself — no child needed for them.
// (A "bar" variant for full-width text buttons — Save changes, Create deck — was attempted once
// via a Button03a sprite, but that sprite's dark maroon fill never matched the cream/tan
// travelbook-slot03a look those buttons actually use, and it was dropped. Full-width text buttons
// still just use the raw `travelbook-slot03a` CSS class directly.)
const SELF_CONTAINED_VARIANTS = ['home', 'back', 'manual', 'about', 'achievement', 'friends'] as const
type AssetButtonVariant = 'square' | (typeof SELF_CONTAINED_VARIANTS)[number]

const VARIANT_TEXTURE_PATH: Record<AssetButtonVariant, string> = {
    square:      '/textures/notebook/button',
    home:        '/textures/notebook/button-home',
    back:        '/textures/notebook/button-back',
    manual:      '/textures/notebook/button-manual',
    about:       '/textures/notebook/button-about',
    achievement: '/textures/notebook/button-achievement',
    // ButtonContact01a (01_TravelBook) — an envelope, not a person icon, but it's the closest
    // painted button the asset pack has to "friends"; there's no multi-person icon in the pack.
    friends:     '/textures/notebook/button-friends',
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
                text-ink-text transition-opacity disabled:opacity-30 ${className}`}
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

// "Menu"/Home button fixed to the top-right of the page — independent from the title/book
// centering below. AssetButton's base classes already set "relative", which would win over a
// "fixed" passed via className (Tailwind's generated position classes follow a fixed internal
// order, not source-code order): positioning is therefore applied to a wrapper around the
// button, not the button itself. variant="home" (ButtonHome01a, 01_TravelBook) instead of the
// old generic square + separate icon: the house icon is already painted into the texture.
//
// Friends/Profile sit to the left of Home in the same row, painted self-contained icons like
// Home rather than a generic square + child. variant="about" (ButtonAbout01a, a person bust) is
// already reused by AccountMenu for account/profile info, so it doubles as the Profile icon here.
// variant="friends" (ButtonContact01a, an envelope) is the closest stand-in for Friends — the
// asset pack has no multi-person icon.
export function HomeButton({ onClick }: { onClick: () => void }) {
    const router = useRouter()

    return (
        <div className="fixed right-6 top-6 z-40 flex items-center gap-2">
            <AssetButton onClick={() => router.push(ROUTES.friends)} variant="friends" className="h-14 w-14 shrink-0" />
            <AssetButton onClick={() => router.push(ROUTES.profile)} variant="about" className="h-14 w-14 shrink-0" />
            <AssetButton onClick={onClick} variant="home" className="h-14 w-14 shrink-0" />
        </div>
    )
}
