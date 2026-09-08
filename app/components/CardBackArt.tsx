import Image from 'next/image'

// One file per card back (public/textures/cards/backs/{index}.webp, each design already drawn
// full-bleed, border included) instead of a CSS background-position/-size crop on a shared
// spritesheet, since `image-rendering: pixelated` at non-integer container sizes can bleed a
// pixel in from the neighboring cell. object-fit: contain (not cover): the source ratio (100×130)
// is wider than the card's (130×191), so contain keeps the whole drawing visible (full width)
// instead of cropping its left/right edges to fill the height.
export default function CardBackArt({ index, className = '' }: { index: number; className?: string }) {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            <Image
                src={`/textures/cards/backs/${index}.webp`}
                alt=""
                fill
                unoptimized
                style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
            />
        </div>
    )
}
