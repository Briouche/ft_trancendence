# `app/game/scenes/BootScene.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript (scène Phaser) · chargement

## 1. Rôle

Première scène : précharge les images fixes, règle le filtrage « pixel net » des textures pixel art, **attend la police** du site, puis démarre `GameScene` avec les paramètres de la partie.

## 2. Dépendances

- **Importe** : `phaser`, `objects/gameFonts.ts`, `objects/gameFontRegistry.ts`, `lib/cardBacks.ts`, `./bootAssets`.

## 3. Explication bloc par bloc

`preload()` → `this.load.image(...)` ; `create()` (async) → `setFilter(NEAREST)` → `await ensureCardFontLoaded()` → `registry.set(...)` → `scene.start("GameScene", params)`.

## 4. Flux concret

Ouverture de `/play/game` → quelques centaines de ms de chargement → la table apparaît.

## 5. Points d'attention

- Attendre la police évite un texte dessiné avec une police de secours (Phaser dessine le texte une fois).

## 6. Questions probables en évaluation

- Aucune spécifique.
