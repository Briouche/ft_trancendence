# `game_engine/srcs/ai/policy.ts`

> Service : **game_engine** · TypeScript · ~40 lignes · comment l'IA choisit un coup en vrai.

## 1. Rôle

Point d'entrée de l'IA pendant une partie : recherche MCTS **plus** comportement humain
(erreurs volontaires, temps de réflexion).

## 2. Dépendances

- **Importe** : `gameEngine.ts`, `ai/mcts.ts` (`getBestAction`), `ai/tree.ts`
  (`isWastedPlay`), `ai/types.ts`.
- **Utilisé par** : `socket/gameSession.ts` (`runAiTurnLoop`), `tests/ai.test.ts`.

## 3. Explication bloc par bloc

```ts
export async function chooseAiAction(engine, difficulty, random = Math.random) {
    const { simulations, worlds, mistakeRate } = DIFFICULTY_PRESETS[difficulty];
    if (random() < mistakeRate) {
        const sensible = engine.getLegalActions()
            .filter(a => a.type !== "endTurn" && !isWastedPlay(engine, a));
        if (sensible.length > 0) return sensible[Math.floor(random() * sensible.length)];
    }
    return getBestAction(engine, simulations, worlds);
}
```

L'erreur n'est jamais « finir son tour » ni jouer une carte dont l'effet ne toucherait rien :
ce serait perçu comme un bug, pas comme une maladresse. `random` est injectable pour les tests.

`thinkingTime(difficulty)` : durée aléatoire entre `thinkMs[0]` et `thinkMs[1]`.

## 4. Flux concret

Tour de l'IA facile : pause de 1,2 à 2,4 s, puis 25 % de chances de jouer un coup au hasard,
sinon le résultat de la recherche.

## 5. Points d'attention

- Rendre l'IA parfaite en difficile : `mistakeRate: 0` (déjà le cas).

## 6. Questions probables en évaluation

- **En quoi l'IA est-elle « humaine » ?** Temps de réaction variable, erreurs volontaires selon
  la difficulté, et anticipation imparfaite (elle ne connaît pas la main adverse et son temps de
  calcul est limité).
