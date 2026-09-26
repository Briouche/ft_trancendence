# `app/game/objects/gameFonts.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript · police du jeu

## 1. Rôle

`ensureCardFontLoaded()` attend que la police pixel du site soit chargée et renvoie son nom de famille, pour que Phaser (qui dessine le texte une seule fois dans un canevas) ne l'affiche jamais avec une police de secours. Mémoïsé ; un échec permet de réessayer.

## 2. Dépendances

- **Utilisé par** : `scenes/BootScene.ts`.

## 3. Explication bloc par bloc

Lit la variable CSS `--font-pixel-game`, puis `document.fonts.load(...)`.

## 4. Flux concret

—

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
