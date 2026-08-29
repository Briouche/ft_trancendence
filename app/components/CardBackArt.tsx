import Image from 'next/image'

// Un fichier par dos de carte (public/textures/cards/backs/{index}.png, découpés depuis
// l'ancienne spritesheet 4×5) plutôt qu'un recadrage CSS background-position/-size sur une
// spritesheet partagée : ce dernier calculait juste, mais `image-rendering: pixelated` combiné à
// des tailles de conteneur non entières faisait parfois déborder un pixel de la case voisine sur
// les bords, et le ratio de la case (104×138) ne correspondant pas toujours à celui du
// conteneur laissait une marge visible (object-fit: contain gère nativement ce recadrage, sans
// ce genre d'artefact).
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
