# `app/lib/cardLayout.ts`

> Service : **app** · TypeScript (client) · ~30 lignes · géométrie d'une carte.

## 1. Rôle

Positions (en % de la carte) du nom, du coût, de la description, de l'attaque, des PV et de
l'illustration, partagées par le rendu HTML (`components/CardFace.tsx`) et le rendu Phaser
(`game/objects/card/*`) pour que les cartes soient identiques partout.

## 2. Dépendances

- **Utilisé par** : `components/CardFace.tsx`, `game/objects/card/Card.ts`,
  `game/objects/card/cardTextLayout.ts`, `game/objects/card/CardPreview.ts`.

## 3. Explication bloc par bloc

`CardBox { left, top, width, height }` en pourcentages ; variantes `_SPELL` pour le cadre des
sorts (sans attaque/PV). `isSpellRarity` : les sorts portent la rareté « Rare ».

## 4. Flux concret

`CARD_COST_BOX` place le coût en haut à droite, en HTML comme en canvas.

## 5. Points d'attention

- Modifier une zone ici la déplace partout.

## 6. Questions probables en évaluation

- Aucune spécifique.
