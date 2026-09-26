# `app/app/play/PlayModeSelector.tsx`

> Service : **app** · Client Component · choix de la partie

## 1. Rôle

Choix du **mode** (Multiplayer / Solo), de la **difficulté** (Easy / Medium / Hard) en solo, affichage de l'Elo en multijoueur et des **paquets gagnés** en cas de victoire ; clic sur un deck → lancement.

## 2. Dépendances

- **Importe** : `ScaleToFit`, `NotebookUI`, `game/scenes/bootAssets.ts`, types du protocole.

## 3. Explication bloc par bloc

- `packsForWin` : doit rester égal à `PACKS_FOR_WIN` (`game_engine/srcs/matchResults.ts`).
- `gameUrl(deckId)` → `/play/game?mode=…&difficulty=…&deckId=…`.
- Préchargement pendant que le joueur choisit : bundle Phaser et images du jeu (le lancement est plus rapide).

## 4. Flux concret

Solo → Hard → deck « Aggro » → la partie démarre.

## 5. Points d'attention

- Sans deck : lien « Create a deck ».

## 6. Questions probables en évaluation

- **Comment lance-t-on une partie contre l'IA ?** Ici, mode Solo.
