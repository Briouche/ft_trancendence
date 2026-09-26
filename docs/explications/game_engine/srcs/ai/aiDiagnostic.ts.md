# `game_engine/srcs/ai/aiDiagnostic.ts`

> Service : **game_engine** · TypeScript · ~160 lignes · outil de mesure de l'IA (hors jeu).

## 1. Rôle

Script autonome (pas utilisé par le serveur) qui fait jouer l'IA **contre elle-même** et compte
les comportements suspects : tours terminés sans attaquer alors que c'était possible, fins de tour
immédiates avec d'autres options, cartes jouées sans effet. Il a servi à régler l'IA.

Lancement : `npx ts-node srcs/ai/aiDiagnostic.ts <facile|moyen|difficile> <nbParties> [--verbose]`
(`AI_TIMING=1` affiche le temps de chaque décision).

## 2. Dépendances

- **Importe** : `gameEngine.ts`, `player.ts`, `hero.ts`, `deck.ts` (`makeBasicDeck`),
  `ai/mcts.ts`, `ai/tree.ts`, `ai/types.ts`.
- **Utilisé par** : personne (outil de développement).

## 3. Explication bloc par bloc

`playOneGame` joue une partie complète avec `getBestAction` pour les deux camps (sans les erreurs
volontaires de `policy.ts`) et remplit des statistiques ; `main` agrège sur N parties.

## 4. Flux concret

`npx ts-node srcs/ai/aiDiagnostic.ts moyen 5` → 5 parties, statistiques par partie puis totaux.

## 5. Points d'attention

- Utilise les decks codés en dur de `deck.ts`, pas ceux de la base.

## 6. Questions probables en évaluation

- **Comment as-tu vérifié que ton IA joue correctement ?** Cet outil + les tests
  (`tests/ai.test.ts` : coups légaux, coup mortel trouvé, erreurs en facile).
