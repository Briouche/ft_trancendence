'use client'

import PackArt, { type PackSkin } from './PackArt'

const PACK_WIDTH = 170

// Les 3 paquets proposés doivent être choisis avant de voir l'animation d'ouverture — pas de
// clic direct sur un coffre comme avant, un vrai choix cosmétique parmi 3 designs différents.
// `locked` (0 paquet en stock) garde les 3 paquets visibles — juste grisés (grayscale) et non
// cliquables — plutôt que de faire disparaître toute la rangée, pour ne pas donner l'impression
// que la page est cassée/vide quand le joueur n'a temporairement rien à ouvrir.
export default function PackChoice({ skins, locked, onChoose }: { skins: PackSkin[]; locked?: boolean; onChoose: (skin: PackSkin) => void }) {
    return (
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-16">
            {skins.map((skin, i) => (
                <button
                    key={`${skin.col}-${skin.row}-${i}`}
                    onClick={() => !locked && onChoose(skin)}
                    disabled={locked}
                    className={`transition-transform duration-200 ${locked ? 'cursor-not-allowed' : 'hover:-translate-y-2'}`}
                >
                    <PackArt
                        skin={skin}
                        width={PACK_WIDTH}
                        className={`rounded-md border-[3px] border-ink-900/50 shadow-lg shadow-black/50 transition-shadow
                            ${locked ? 'grayscale' : 'hover:border-gold-400 hover:shadow-gold-500/30'}`}
                    />
                </button>
            ))}
        </div>
    )
}
