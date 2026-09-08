'use client'

import PackArt, { type PackSkin } from './PackArt'

const PACK_WIDTH = 170

// The 3 offered packs must be picked before the opening animation — a real cosmetic choice, not
// a direct click on a chest. `locked` (0 packs in stock) keeps all 3 visible but grayed out and
// unclickable, rather than hiding the row, so the page doesn't look broken when empty.
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
