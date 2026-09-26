# `app/game/objects/board/CardRow.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · Objet Phaser (TypeScript) · rangée de serviteurs

## 1. Rôle

Une rangée (un camp) : insertion, retrait, synchronisation avec l'état et disposition centrée.

## 2. Dépendances

- **Importe** : `BoardMath.ts`, `card/Card.ts`.
- **Utilisé par** : `Board.ts`.

## 3. Explication bloc par bloc

`sync(données, monTour)` recrée/actualise les cartes dans l'ordre du serveur ; `applyInteractivity` rend déplaçables seulement ses propres serviteurs, à son tour.

## 4. Flux concret

—

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
