// Palette miroir de app/globals.css (@theme) — à garder synchronisée avec les tokens Tailwind,
// car les matériaux Three.js ne peuvent pas lire les variables CSS directement. Les noms de clés
// (leather/gold/parchment) datent du thème cuir/or d'origine ; ils servent maintenant une palette
// pierre/gris terne, choisie pour ne plus avoir cette teinte brune-jaune dominante.
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

// Ambiance commune à toutes les salles (reprise de BookScene, qui a établi le ton "bibliothèque
// lugubre" : plus sombre que ink-950, brouillard court pour que le hall se perde dans le noir).
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
