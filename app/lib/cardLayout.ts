// Text regions hand-measured on the 4 card frames (public/textures/cards/frame/frame-*.webp) —
// single source of truth shared between CardFace.tsx (DOM rendering) and the in-game Phaser
// rendering (Card.ts, CardPreview.ts) so both stay aligned on the same visuals.
export interface CardBox
{
    left: number;
    top: number;
    width: number;
    height: number;
}

export const CARD_NAME_BOX: CardBox = { left: 5.4, top: 4.2, width: 70, height: 7.9 };
export const CARD_NAME_BOX_SPELL: CardBox = { left: 5.4, top: 4.2, width: 70.8, height: 8.4 };

export const CARD_COST_BOX: CardBox = { left: 78.3, top: 4.5, width: 18, height: 11 };
export const CARD_COST_BOX_SPELL: CardBox = { left: 79.2, top: 3.1, width: 16.2, height: 12.6 };

export const CARD_DESC_BOX: CardBox = { left: 5.4, top: 57.1, width: 88.5, height: 32 };
export const CARD_DESC_BOX_SPELL: CardBox = { left: 5.4, top: 57.1, width: 89.2, height: 38.7 };

export const CARD_ATTACK_BOX: CardBox = { left: 4.5, top: 86, width: 18, height: 11 };
export const CARD_HEALTH_BOX: CardBox = { left: 80, top: 86, width: 18, height: 11 };

// The actual hole cut into the frame (the PNG's transparent area) where card artwork sits behind
// the frame — measured off the shared alpha channel (x=21-368 of 390px wide, y=81-317 of 573px
// tall). Wider than the legendary-portrait area in CardFace.tsx, which is a deliberately small,
// centered badge rather than a fill for the whole hole.
export const CARD_ART_BOX: CardBox = { left: 5.4, top: 14.1, width: 89, height: 41.2 };

// The "Rare" frame (spells) has no swords or blood drop: its bottom text box is taller and its
// gem sits in a different spot (see CardFace.tsx) — every spell is filed under this rarity, which
// therefore is never a creature.
export const SPELL_RARITIES = new Set(["Rare"]);
export const isSpellRarity = (rarity: string) => SPELL_RARITIES.has(rarity);
