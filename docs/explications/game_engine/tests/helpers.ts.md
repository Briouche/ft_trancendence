# `game_engine/tests/helpers.ts`

> Service : **game_engine** · TypeScript · tests · fabriques d'états de jeu.

## 1. Rôle

Petites fonctions pour construire des parties déterministes dans les tests : `minion(atk, pv,
coût, motsClés)`, `damageSpell(n)`, `filler(n)` (n serviteurs 1/1), `newEngine(deck0, deck1)`
(deux joueurs, partie non démarrée).

## 2. Dépendances

- **Importe** : `card.ts`, `deck.ts`, `hero.ts`, `player.ts`, `gameEngine.ts`, `effect.ts`,
  `target.ts`.
- **Utilisé par** : `gameEngine.test.ts`, `ai.test.ts`.

## 3. Explication bloc par bloc

Chaque carte reçoit un id unique (`m0`, `m1`, … / `s0`, …) grâce à un compteur, comme en jeu.

## 4. Flux concret

`const engine = newEngine(); engine.board.playMinion(0, minion(3, 2));` → un plateau prêt à tester.

## 5. Points d'attention

- Les decks sont mélangés au démarrage : pour garantir qu'une carte est en main, l'ajouter
  directement (`hand.add`).

## 6. Questions probables en évaluation

- **Comment testes-tu des règles sans lancer une partie complète ?** En construisant l'état
  voulu avec ces fabriques.
