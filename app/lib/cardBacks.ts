// Catalogue de dos de carte cosmétiques : grille 4×5 (voir public/textures/cards/card-backs.png).
// Provenance/licence non retrouvée à côté du fichier téléchargé — à vérifier avant tout usage
// commercial, credits à compléter dans le README une fois la source confirmée.
export const CARD_BACK_COLUMNS = 4
export const CARD_BACK_ROWS = 5
export const CARD_BACK_COUNT = CARD_BACK_COLUMNS * CARD_BACK_ROWS

export function isValidCardBack(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < CARD_BACK_COUNT
}
