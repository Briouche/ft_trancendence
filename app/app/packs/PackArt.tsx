import type { CSSProperties } from 'react'

// Sprite-sheet "CardPacks" (couvertures de paquet non ouvert) : 9 teintes de couleur (colonnes)
// × 20 motifs (lignes) = 180 designs, chacun une illustration complète et statique — malgré le nom
// du fichier source, il n'y a pas de séquence d'animation dedans (vérifié image par image), donc
// l'ouverture (secousse + éclat) est une animation CSS maison plutôt que des frames de l'asset.
// Provenance/licence non retrouvée à côté du fichier téléchargé — à vérifier avant tout usage
// commercial, credits à compléter dans le README une fois la source confirmée.
const SHEET_URL = '/textures/packs/card-packs.png'
const SHEET_W = 849
const SHEET_H = 3143
const CELL_W = 84
const CELL_H = 154
const COL_X = [3, 98, 193, 288, 383, 478, 573, 667, 762]
const ROW_Y = [3, 160, 317, 474, 631, 788, 945, 1102, 1259, 1416, 1573, 1730, 1887, 2044, 2201, 2358, 2515, 2672, 2829, 2986]

export const PACK_COLUMNS = COL_X.length
export const PACK_ROWS = ROW_Y.length

export type PackSkin = { col: number; row: number }

function randomPackSkin(): PackSkin {
    return {
        col: Math.floor(Math.random() * PACK_COLUMNS),
        row: Math.floor(Math.random() * PACK_ROWS),
    }
}

// `count` designs distincts (jamais deux fois la même case) tirés des 180 combinaisons.
export function randomPackSkins(count: number): PackSkin[] {
    const seen = new Set<string>()
    const skins: PackSkin[] = []
    while (skins.length < count) {
        const skin = randomPackSkin()
        const key = `${skin.col}-${skin.row}`
        if (seen.has(key)) continue
        seen.add(key)
        skins.push(skin)
    }
    return skins
}

export default function PackArt({ skin, width, className = '', style }: {
    skin:      PackSkin
    width:     number
    className?: string
    style?:    CSSProperties
}) {
    const scale  = width / CELL_W
    const height = CELL_H * scale

    return (
        <div
            className={className}
            style={{
                width,
                height,
                backgroundImage: `url(${SHEET_URL})`,
                backgroundPosition: `-${COL_X[skin.col] * scale}px -${ROW_Y[skin.row] * scale}px`,
                backgroundSize: `${SHEET_W * scale}px ${SHEET_H * scale}px`,
                imageRendering: 'pixelated',
                ...style,
            }}
        />
    )
}
