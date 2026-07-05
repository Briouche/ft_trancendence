import CardFace, { type CardFaceData } from '@/components/CardFace'

export default function PackCardReveal({ card, revealed, onReveal }: {
    card:     CardFaceData
    revealed: boolean
    onReveal: () => void
}) {
    return (
        <div
            onClick={() => { if (!revealed) onReveal() }}
            className={`relative aspect-[3/4] w-full [perspective:1200px] transition-transform duration-200 hover:scale-110
                ${revealed ? '' : 'cursor-pointer'}`}
        >
            <div
                className={`relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d]
                    ${revealed ? '[transform:rotateY(180deg)]' : ''}`}
            >
                {/* Dos de la carte : sceau de cire sur cuir */}
                <div className="absolute inset-0 flex items-center justify-center rounded-lg border-[3px]
                    border-gold-500/60 bg-gradient-to-br from-leather-800 to-ink-900 shadow-lg [backface-visibility:hidden]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-gold-400/70 bg-leather-900/60">
                        <span className="font-display text-xl text-gold-400/90">✦</span>
                    </div>
                </div>

                {/* Face de la carte */}
                <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <div className={revealed ? 'animate-card-pop h-full' : 'h-full'} style={{ animationDelay: '350ms' }}>
                        <CardFace card={card} />
                    </div>
                </div>
            </div>
        </div>
    )
}
