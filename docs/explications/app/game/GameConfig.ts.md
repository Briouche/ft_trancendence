# `app/game/GameConfig.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript · configuration Phaser

## 1. Rôle

Crée la configuration Phaser d'une partie : rendu automatique (WebGL sinon Canvas), redimensionnement à la taille de la fenêtre, **son désactivé**, scènes `BootScene` puis `GameScene`, paramètres de la partie transmis à `BootScene`. Exporte le type `GameMode`.

## 2. Dépendances

- **Importe** : `phaser`, `scenes/BootScene`, `scenes/GameScene`.
- **Utilisé par** : `components/game/GameLauncher.tsx`.

## 3. Explication bloc par bloc

`audio: { noAudio: true }` : le jeu n'a pas de son ; sans ça, Phaser crée un `AudioContext` qui provoquait une erreur console en quittant la page.

## 4. Flux concret

`new Phaser.Game(createGameConfig(div, "solo", "facile", 4, 0))`.

## 5. Points d'attention

- `Scale.RESIZE` : le canevas suit la taille de la fenêtre.

## 6. Questions probables en évaluation

- Aucune spécifique.
