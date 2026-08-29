// Catalogue de dos de carte cosmétiques : 20 fichiers (public/textures/cards/backs/{0..19}.png,
// découpés depuis une grille 4×5 d'origine). Provenance/licence non retrouvée à côté du fichier
// téléchargé — à vérifier avant tout usage commercial, credits à compléter dans le README une
// fois la source confirmée.
export const CARD_BACK_COLUMNS = 4
export const CARD_BACK_ROWS = 5
export const CARD_BACK_COUNT = CARD_BACK_COLUMNS * CARD_BACK_ROWS

export function isValidCardBack(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < CARD_BACK_COUNT
}
