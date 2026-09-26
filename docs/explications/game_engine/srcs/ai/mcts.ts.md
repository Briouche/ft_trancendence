# `game_engine/srcs/ai/mcts.ts`

> Service : **game_engine** · TypeScript · ~60 lignes · la recherche du meilleur coup.

## 1. Rôle

`getBestAction(engine, simulations, worlds)` renvoie le coup que l'IA juge le meilleur, par
**recherche arborescente Monte-Carlo (MCTS)** avec **déterminisation** (information cachée).

## 2. Dépendances

- **Importe** : `gameEngine.ts`, `ai/determinize.ts`, `ai/tree.ts`.
- **Utilisé par** : `ai/policy.ts`, `ai/aiDiagnostic.ts`, les tests.

## 3. Explication bloc par bloc

```ts
for (let w = 0; w < worlds; w++) {
    const root = createNode(await determinize(engine, currentPlayer), null, null);   // 1 monde imaginé
    for (let i = 0; i < simulations; i++) {
        let node = root;
        while (!terminal && tout a été essayé && a des enfants) node = selectBestChild(node);   // 1. sélection (UCB1)
        if (!terminal && reste des coups à essayer) node = expand(node);                         // 2. expansion
        const result = simulate(node.state, currentPlayer, node.depth);                          // 3. simulation
        backpropagate(node, result, currentPlayer);                                              // 4. rétropropagation
    }
    // taux de victoire de chaque coup racine, vu par l'IA (winRateFor), cumulé sur les mondes
}
// meilleur taux moyen ; à égalité, le coup le plus visité
```

**Les 4 étapes de MCTS** :
1. **Sélection** : on descend dans l'arbre en choisissant l'enfant qui maximise UCB1 = taux de
   victoire + bonus d'exploration (les coups peu essayés ont un bonus).
2. **Expansion** : on ajoute un coup pas encore essayé.
3. **Simulation** : on joue la suite au hasard jusqu'à la fin (ou 60 coups, puis évaluation).
4. **Rétropropagation** : on remonte le résultat dans tous les nœuds parcourus.

**Déterminisation** : l'IA ne connaît pas la main de l'humain ; chaque « monde » tire une main
plausible au hasard (`determinize.ts`). Moyenner sur plusieurs mondes évite de jouer comme si elle
voyait les cartes.

## 4. Flux concret

En difficile : 8 mondes × 2000 simulations ; si « attaquer le héros » gagne 97 % du temps en
moyenne, c'est ce coup qui est joué.

## 5. Points d'attention

- Égalité de score (deux coups tous deux gagnants) → le plus visité, c'est-à-dire celui où la
  recherche a le plus investi. Avant ce départage (et la pénalité de délai dans `tree.ts`), l'IA
  pouvait finir son tour avec un coup gagnant disponible.

## 6. Questions probables en évaluation

- **Explique ton IA.** MCTS : sélection UCB1, expansion, simulation aléatoire, rétropropagation,
  sur plusieurs mondes imaginés pour gérer l'information cachée.
- **Pourquoi pas un minimax ?** Trop de coups possibles et de hasard (pioche, cibles aléatoires) ;
  MCTS s'adapte au temps disponible et n'a pas besoin d'une fonction d'évaluation parfaite.
