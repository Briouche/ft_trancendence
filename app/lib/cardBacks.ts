// Catalogue de dos de carte cosmétiques : 8 fichiers (public/textures/cards/backs/{0..7}.png),
// chacun son propre design découpé individuellement (plus une grille 4×5 partagée comme avant).
export const CARD_BACK_COUNT = 8

export function isValidCardBack(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < CARD_BACK_COUNT
}
