# `app/game/scenes/bootAssets.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript · images à précharger

## 1. Rôle

Liste des images fixes du jeu (table, cadres de cartes, dos de cartes, icônes, héros…), partagée par `BootScene` (préchargement Phaser) et `PlayModeSelector` (préchargement navigateur pendant que le joueur choisit son deck).

## 2. Dépendances

- **Importe** : `lib/cardBacks.ts`.
- **Utilisé par** : `scenes/BootScene.ts`, `app/play/PlayModeSelector.tsx`.

## 3. Explication bloc par bloc

Tableau `{ key, path }` ; une entrée par dos de carte générée.

## 4. Flux concret

Sur `/play`, les images sont déjà en cache quand la partie démarre.

## 5. Points d'attention

- Les illustrations des cartes ne sont pas ici : chargées à la demande (`CardAssetLoader`).

## 6. Questions probables en évaluation

- Aucune spécifique.
