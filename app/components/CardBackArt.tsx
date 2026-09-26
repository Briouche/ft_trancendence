import Image from 'next/image'

/** One cosmetic card back (public/textures/cards/backs/{index}.webp), fitted inside its container. */
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
