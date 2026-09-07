// Catalogue de dos de carte cosmétiques : 8 fichiers (public/textures/cards/backs/{0..7}.png),
// chacun son propre design découpé individuellement (plus une grille 4×5 partagée comme avant).
export const CARD_BACK_COUNT = 8

// 0-2 sont offerts d'office à tout le monde dès la création du compte (voir schema.prisma,
// User.unlockedCardBacks @default — et /api/collection/clear, qui doit revenir à ce même état,
// pas à un simple [0]). Les 5 index ci-dessous sont réservés à un haut fait précis, jamais
// tirables au hasard dans un paquet (voir packs.ts, qui exclut ces index du pool de tirage).
export const DEFAULT_UNLOCKED_CARD_BACKS = [0, 1, 2]

export const ACHIEVEMENT_CARD_BACKS = {
    winVsPlayer:    3,
    winVsAiEasy:    4,
    winVsAiMedium:  5,
    winVsAiHard:    6,
    fullCollection: 7,
} as const

// Texte affiché sur un dos encore verrouillé pour expliquer comment le débloquer (voir
// CollectionBook.tsx) — indexé par le même index que ACHIEVEMENT_CARD_BACKS ci-dessus. Les index
// 1 et 2 (pur drop de paquet) n'y figurent pas : ils gardent juste l'icône de cadenas, sans texte,
// puisqu'"ouvrir des paquets" n'est pas un haut fait précis à expliquer.
export const ACHIEVEMENT_CARD_BACK_HINTS: Record<number, string> = {
    [ACHIEVEMENT_CARD_BACKS.winVsPlayer]:    'Win a game vs another player',
    [ACHIEVEMENT_CARD_BACKS.winVsAiEasy]:    'Win a game vs AI (Easy)',
    [ACHIEVEMENT_CARD_BACKS.winVsAiMedium]:  'Win a game vs AI (Medium)',
    [ACHIEVEMENT_CARD_BACKS.winVsAiHard]:    'Win a game vs AI (Hard)',
    [ACHIEVEMENT_CARD_BACKS.fullCollection]: 'Complete the full card collection',
}

export function isValidCardBack(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < CARD_BACK_COUNT
}
