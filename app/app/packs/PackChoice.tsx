'use client'

import PackArt, { type PackSkin } from './PackArt'

const PACK_WIDTH = 170

// Les 3 paquets proposés doivent être choisis avant de voir l'animation d'ouverture — pas de
// clic direct sur un coffre comme avant, un vrai choix cosmétique parmi 3 designs différents.
export default function PackChoice({ skins, onChoose }: { skins: PackSkin[]; onChoose: (skin: PackSkin) => void }) {
    return (
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-8">
            {skins.map((skin, i) => (
                <button
                    key={`${skin.col}-${skin.row}-${i}`}
                    onClick={() => onChoose(skin)}
                    className="group flex flex-col items-center gap-3 transition-transform duration-200 hover:-translate-y-2"
                >
                    <PackArt
                        skin={skin}
                        width={PACK_WIDTH}
                        className="rounded-md border-[3px] border-gold-500/40 shadow-lg shadow-black/50 transition-shadow
                            group-hover:border-gold-400 group-hover:shadow-gold-500/30"
                    />
                    <span className="font-serif text-xs uppercase tracking-[0.2em] text-parchment-300/70 group-hover:text-gold-300">
                        Choose
                    </span>
                </button>
            ))}
        </div>
    )
}
