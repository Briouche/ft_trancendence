# `app/game/objects/card/cardTextLayout.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript · placement du texte

## 1. Rôle

Aides pour placer et **dimensionner** le texte des cartes dans les zones de `lib/cardLayout.ts` : boîtes de chiffres agrandies, centre d'une zone, réduction de police jusqu'à ce que le texte tienne, et `maximizeTextToBox` (plus grande taille qui tient, par **recherche dichotomique**), avec cache.

## 2. Dépendances

- **Utilisé par** : `card/Card.ts`, `card/CardPreview.ts`.

## 3. Explication bloc par bloc

La recherche dichotomique est valable car « tenir » est monotone : une police plus grande ne tient jamais là où une plus petite ne tenait pas.

## 4. Flux concret

Un nom long (« Leon, le chien saucisse ») est affiché plus petit qu'un nom court.

## 5. Points d'attention

- Le cache arrondit les dimensions pour ne pas se fragmenter.

## 6. Questions probables en évaluation

- Aucune spécifique.
