// Régions de texte mesurées à la main sur les 4 cadres (public/textures/cards/frame/frame-*.png) —
// source unique partagée entre CardFace.tsx (rendu DOM) et le rendu Phaser en jeu (Card.ts,
// CardPreview.ts), pour que les deux restent alignés sur le même visuel.
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

// Le vrai trou découpé dans le cadre (zone transparente du PNG) où vient se poser l'illustration
// de la carte, derrière le cadre — mesuré directement sur le canal alpha des 4 frame-*.png
// (identique sur les 4, à 0.1% près) : transparent de x=21 à x=368 sur 390px de large, de y=81 à
// y=317 sur 573px de haut. Plus large que la zone du portrait légendaire dans CardFace.tsx
// (25%/16%/50%/36%, un badge volontairement petit et centré) — ici on veut remplir tout le trou.
export const CARD_ART_BOX: CardBox = { left: 5.4, top: 14.1, width: 89, height: 41.2 };

// Le cadre "Rare" (sorts) n'a ni épées ni goutte de sang : sa case de texte du bas est plus haute
// et sa gemme est positionnée différemment (voir CardFace.tsx) — tous les sorts sont rangés dans
// cette rareté, qui n'est donc jamais une créature.
export const SPELL_RARITIES = new Set(["Rare"]);
export const isSpellRarity = (rarity: string) => SPELL_RARITIES.has(rarity);
