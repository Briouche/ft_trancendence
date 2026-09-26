# `app/game/objects/board/BoardMath.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript · calculs de disposition

## 1. Rôle

`computeXs(n, hauteur, centreX, ratio)` : abscisses de n emplacements centrés.

## 2. Dépendances

- **Utilisé par** : `CardRow.ts`, `Board.ts`.

## 3. Explication bloc par bloc

Largeur totale = (n−1)×espacement + taille d'une case, puis décalage depuis le centre.

## 4. Flux concret

—

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
