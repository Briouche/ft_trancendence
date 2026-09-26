// Cosmetic card backs: 8 designs in public/textures/cards/backs/{0..7}.webp.
export const CARD_BACK_COUNT = 8

// Backs every account starts with.
export const DEFAULT_UNLOCKED_CARD_BACKS = [0, 1, 2]

// Backs unlocked by an achievement instead of being drawn from packs.
export const ACHIEVEMENT_CARD_BACKS = {
    winVsPlayer:    3,
    winVsAiEasy:    4,
    winVsAiMedium:  5,
    winVsAiHard:    6,
    fullCollection: 7,
} as const

// Unlock hint shown on a locked back in the Collection.
export const ACHIEVEMENT_CARD_BACK_HINTS: Record<number, string> = {
    [ACHIEVEMENT_CARD_BACKS.winVsPlayer]:    'Win a game vs another player',
    [ACHIEVEMENT_CARD_BACKS.winVsAiEasy]:    'Win a game vs AI (Easy)',
    [ACHIEVEMENT_CARD_BACKS.winVsAiMedium]:  'Win a game vs AI (Medium)',
    [ACHIEVEMENT_CARD_BACKS.winVsAiHard]:    'Win a game vs AI (Hard)',
    [ACHIEVEMENT_CARD_BACKS.fullCollection]: 'Complete the full card collection',
}

/** True for an integer index of an existing card back. */
export function isValidCardBack(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < CARD_BACK_COUNT
}
