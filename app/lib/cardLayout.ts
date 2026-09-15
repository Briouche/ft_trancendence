// Card zones in % of the card size, shared by CardFace (DOM) and the Phaser card renderers.
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

// Cutout window of the frame where the illustration sits.
export const CARD_ART_BOX: CardBox = { left: 5.4, top: 14.1, width: 89, height: 41.2 };

// Spells all carry the "Rare" rarity; their frame has no attack/health slots.
const SPELL_RARITIES = new Set(["Rare"]);
export const isSpellRarity = (rarity: string) => SPELL_RARITIES.has(rarity);
