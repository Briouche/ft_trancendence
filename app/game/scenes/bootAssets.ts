import { CARD_BACK_COUNT } from "@/lib/cardBacks";

// The static (non-per-card) images BootScene preloads before a match starts. Pulled into one
// list, instead of being inline calls only inside BootScene.preload(), so the same paths can also
// be warmed via plain <img>/Image() prefetch while the user is still choosing a mode/deck on
// /play — see PlayModeSelector.tsx.
export const BOOT_IMAGE_ASSETS: { key: string; path: string }[] = [
    { key: "shield_taunt", path: "/gameAssets/shield_taunt.webp" },
    { key: "effect_lightning", path: "/gameAssets/lightning_bolt.webp" },
    { key: "history_attack", path: "/gameAssets/attackSword.webp" },
    { key: "history_turnEnded", path: "/gameAssets/hourglass.webp" },
    { key: "wooden_table", path: "/gameAssets/wooden_table.webp" },
    { key: "banner", path: "/gameAssets/UI_NoteBook_Banner04a.webp" },
    { key: "emptyEnergy", path: "/gameAssets/UI_TravelBook_IconEnergy01g.webp" },
    { key: "fullEnergy", path: "/gameAssets/UI_TravelBook_IconEnergy02a.webp" },
    { key: "heroFrame", path: "/gameAssets/hero.webp" },
    { key: "opponentHeroFrame", path: "/gameAssets/opponentHero.webp" },
    { key: "frame_commune", path: "/textures/cards/frame/frame-commune.webp" },
    { key: "frame_rare", path: "/textures/cards/frame/frame-rare.webp" },
    { key: "frame_epique", path: "/textures/cards/frame/frame-epique.webp" },
    { key: "frame_legendaire", path: "/textures/cards/frame/frame-legendaire.webp" },
    ...Array.from({ length: CARD_BACK_COUNT }, (_, i) => ({ key: `cardBack_${i}`, path: `/textures/cards/backs/${i}.webp` })),
];
