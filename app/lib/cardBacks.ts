// Catalog of cosmetic card backs: 8 individually-cropped design files
// (public/textures/cards/backs/{0..7}.webp).
export const CARD_BACK_COUNT = 8

// 0-2 are granted to everyone by default at account creation (see schema.prisma,
// User.unlockedCardBacks @default) and are the set /api/collection/clear resets to. The 5
// indices below are each tied to a specific achievement and are never drawn at random from a
// pack (see packs.ts, which excludes them from the draw pool).
export const DEFAULT_UNLOCKED_CARD_BACKS = [0, 1, 2]

export const ACHIEVEMENT_CARD_BACKS = {
    winVsPlayer:    3,
    winVsAiEasy:    4,
    winVsAiMedium:  5,
    winVsAiHard:    6,
    fullCollection: 7,
} as const

// Hint text shown on a still-locked back to explain how to unlock it (see CollectionBook.tsx) —
// indexed by the same index as ACHIEVEMENT_CARD_BACKS above. Indices 1 and 2 (plain pack drops)
// are absent on purpose: they just keep the lock icon with no text, since "open packs" isn't a
// specific achievement worth explaining.
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
