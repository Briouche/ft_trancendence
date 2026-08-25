import { CARD_BACK_COLUMNS, CARD_BACK_ROWS } from '@/lib/cardBacks'

// Recadrage en pourcentages (pas de largeur en px comme PackArt) : ce composant est toujours
// utilisé à l'intérieur d'un conteneur qui contrôle déjà sa taille (aspect-[3/4] w-full de
// CardFace, cellule de grille du sélecteur...), donc il se contente de remplir son parent.
export default function CardBackArt({ index, className = '' }: { index: number; className?: string }) {
    const col = index % CARD_BACK_COLUMNS
    const row = Math.floor(index / CARD_BACK_COLUMNS) % CARD_BACK_ROWS

    return (
        <div
            className={className}
            style={{
                backgroundImage: 'url(/textures/cards/card-backs.png)',
                backgroundPosition: `${(col / (CARD_BACK_COLUMNS - 1)) * 100}% ${(row / (CARD_BACK_ROWS - 1)) * 100}%`,
                backgroundSize: `${CARD_BACK_COLUMNS * 100}% ${CARD_BACK_ROWS * 100}%`,
                imageRendering: 'pixelated',
            }}
        />
    )
}
