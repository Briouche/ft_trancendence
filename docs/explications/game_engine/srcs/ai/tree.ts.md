# `game_engine/srcs/ai/tree.ts`

> Service : **game_engine** · TypeScript · ~185 lignes · les briques de MCTS.

## 1. Rôle

Les nœuds de l'arbre de recherche et les 4 opérations de MCTS : sélection (UCB1), expansion,
simulation (partie jouée au hasard), rétropropagation.

## 2. Dépendances

- **Importe** : `gameEngine.ts` (moteur, `Action`), `target.ts`, `card.ts`, `effect.ts`.
- **Utilisé par** : `ai/mcts.ts`, `ai/policy.ts` (`isWastedPlay`), `ai/aiDiagnostic.ts`.

## 3. Explication bloc par bloc

- `MCTSNode` : état, parent, coup qui y mène, enfants, visites, victoires, coups non essayés,
  `ownerIndex` (**joueur qui doit jouer dans ce nœud**), `depth`.
- `applyAction(engine, action)` : joue le coup sur un **clone** (la vraie partie n'est jamais
  touchée).
- `winRateFor(parent, child)` :

```ts
const rate = child.wins / child.visits;
return child.ownerIndex === parent.ownerIndex ? rate : 1 - rate;
```

Les victoires d'un nœud sont comptées pour le joueur qui y a la main. Après une carte ou une
attaque, c'est toujours le même joueur ; après « fin de tour », c'est l'adversaire. Pour comparer
des enfants, on se place donc toujours du point de vue de celui qui choisit.

- `ucb1(parent, child)` = `winRateFor + √2 × √(ln(visites parent) / visites enfant)` ; un enfant
  jamais visité vaut l'infini (on l'essaie d'abord).
- `expand` : prend un coup non essayé au hasard et crée l'enfant.
- `isWastedPlay` : une carte dont l'effet ne toucherait rien (on l'évite dans les simulations).
- `evaluate` : si la simulation s'arrête avant la fin (60 coups), score entre 0 et 1 surtout basé
  sur les PV, avec le plateau et la main pour départager.
- `simulate(state, forPlayer, startDepth)` : partie au hasard ; une victoire vaut
  `1 − (profondeur × 0,002)` (plafonné) → **gagner vite vaut plus que gagner tard** ; une
  défaite vaut le symétrique.
- `backpropagate` : ajoute la visite et le résultat (vu par le joueur de chaque nœud) jusqu'à la
  racine.

## 4. Flux concret

Position où l'IA a un coup mortel : l'enfant « attaque le héros » est terminal (victoire en
profondeur 1 → 0,998), l'enfant « fin de tour » ne gagne qu'au tour suivant (score plus bas) → la
recherche concentre ses visites sur l'attaque.

## 5. Points d'attention

- Deux bugs corrigés ici : UCB1 mélangeait les points de vue (après « fin de tour », le taux de
  l'adversaire était lu comme celui de l'IA), et les victoires rapides ne valaient pas plus que les
  lentes. Tests : `tests/ai.test.ts` (« takes lethal within its turn »).

## 6. Questions probables en évaluation

- **Que représente UCB1 ?** Le compromis exploitation (bon taux de victoire) / exploration (coup
  peu essayé).
- **Pourquoi des parties aléatoires donnent-elles un bon coup ?** Sur des milliers de parties,
  les bons coups gagnent plus souvent, même avec une suite jouée au hasard.
