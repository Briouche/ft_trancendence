# `game_engine/tests/ai.test.ts`

> Service : **game_engine** · tests de l'IA.

## 1. Rôle

Vérifie que l'IA joue des coups légaux, trouve un coup gagnant, commet des erreurs en facile et
jamais en difficile, et que les difficultés sont ordonnées.

## 2. Dépendances

- **Importe** : `ai/mcts.ts`, `ai/types.ts`, `ai/policy.ts` (import dynamique), `tests/helpers.ts`.

## 3. Ce qui est testé

- **always returns a legal action** : le coup renvoyé figure dans `getLegalActions()`.
- **takes lethal within its turn** : avec un serviteur 5/5 contre un héros à 3 PV, on joue le tour
  de l'IA coup par coup (comme `GameSession`) → elle doit gagner avant de finir son tour (ce test a
  révélé et vérifie la correction de deux bugs MCTS).
- **uses a targeted spell for lethal** : sort de 5 dégâts, héros à 4 PV → l'IA joue une carte.
- **difficulty presets scale** : `simulations × worlds` croît avec la difficulté.
- **human-like policy** : avec un tirage forcé à 0, le facile joue un coup au hasard (pas « fin de
  tour »), le difficile passe par la recherche ; `thinkingTime` reste dans l'intervalle.

## 4. Flux concret

`npm test -- tests/ai.test.ts` (quelques secondes : vraies recherches).

## 5. Points d'attention

- Le test du coup mortel est volontairement **indépendant de l'ordre** des coups (poser une carte
  puis attaquer est aussi gagnant).

## 6. Questions probables en évaluation

- **Comment prouves-tu que ton IA peut gagner ?** Ces tests + une partie en direct.
