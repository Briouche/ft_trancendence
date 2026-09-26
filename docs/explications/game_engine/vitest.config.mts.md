# `game_engine/vitest.config.mts`

> Service : **game_engine** · configuration des tests.

## 1. Rôle

Configure vitest : tests dans `tests/**/*.test.ts`, environnement Node, 20 s de délai (les tests
d'IA font de vraies recherches MCTS).

## 2. Dépendances

`vitest`.

## 3. Explication bloc par bloc

Un seul objet `test` : `include`, `environment`, `testTimeout`.

## 4. Flux concret

`npm test` lit ce fichier.

## 5. Points d'attention

- Les tests n'utilisent ni base ni socket (le module Prisma est simulé quand nécessaire).

## 6. Questions probables en évaluation

- **Que testent tes tests ?** Voir les pages de `game_engine/tests/`.
