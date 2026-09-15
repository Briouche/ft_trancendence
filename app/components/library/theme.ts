// Colors used by Three.js materials, mirroring the Tailwind tokens in app/globals.css.
export const PALETTE = {
    ink900: '#15171a',
    ink700: '#2b2f33',

    parchment100: '#d4d6d3',
    parchment200: '#b7bab8',

    leather700: '#5a5e62',
    leather800: '#454850',
    leather900: '#33363a',

    gold300: '#cbb883',
    gold400: '#b3a06a',
    gold500: '#8f8058',
    gold600: '#726550',
} as const

export const ATMOSPHERE = {
    background: '#08090a',
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
