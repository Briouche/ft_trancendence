// Palette mirroring app/globals.css (@theme) — keep this in sync with the Tailwind tokens, since
// Three.js materials can't read CSS variables directly. The key names (leather/gold/parchment)
// date back to the original leather/gold theme; they now serve a dull stone/gray palette, chosen
// to get rid of that dominant brown-yellow tint.
export const PALETTE = {
    ink950: '#0b0c0d',
    ink900: '#15171a',
    ink800: '#1f2225',
    ink700: '#2b2f33',

    parchment50:  '#e9eae8',
    parchment100: '#d4d6d3',
    parchment200: '#b7bab8',
    parchment300: '#9a9d9b',

    leather700: '#5a5e62',
    leather800: '#454850',
    leather900: '#33363a',

    gold300: '#cbb883',
    gold400: '#b3a06a',
    gold500: '#8f8058',
    gold600: '#726550',
} as const

// Atmosphere shared by every room (carried over from BookScene, which established the "gloomy
// library" tone: darker than ink-950, short fog so the hall fades into darkness).
export const ATMOSPHERE = {
    background: '#08090a',
    fogNear: 6,
    fogFar: 18,
    ambientIntensity: 0.32,
    ambientColor: '#767b80',
} as const

export const LANTERN = {
    color: '#ffb066',
    intensity: 22,
    distance: 18,
    angle: 0.7,
    penumbra: 0.5,
    decay: 1.3,
} as const
