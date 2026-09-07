import Image from 'next/image'

// Un fichier par dos de carte (public/textures/cards/backs/{index}.png, chaque design déjà
// dessiné pleine case, bord compris) plutôt qu'un recadrage CSS background-position/-size sur une
// spritesheet partagée : ce dernier calculait juste, mais `image-rendering: pixelated` combiné à
// des tailles de conteneur non entières faisait parfois déborder un pixel de la case voisine sur
// les bords. object-fit: contain (pas cover) : le ratio des sources (100×130) est plus large que
// celui de la carte (130×191) — cover recadrait les bords gauche/droit du dessin pour remplir la
// hauteur, contain garde tout le dessin visible (pleine largeur) quitte à laisser une fine bande
// vide en haut/bas.
export default function CardBackArt({ index, className = '' }: { index: number; className?: string }) {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            <Image
                src={`/textures/cards/backs/${index}.png`}
                alt=""
                fill
                unoptimized
                style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
            />
        </div>
    )
}
