# `game_engine/srcs/ai/types.ts`

> Service : **game_engine** · TypeScript · ~15 lignes · réglages des difficultés de l'IA.

## 1. Rôle

Les trois niveaux de l'IA et leurs paramètres. Les clés (`facile`, `moyen`, `difficile`) sont
les valeurs envoyées par le client.

## 2. Dépendances

- **Importe** : rien.
- **Utilisé par** : `ai/policy.ts`, `socket/gameSession.ts`, `socket/validateMessage.ts`,
  `matchResults.ts`, `ai/aiDiagnostic.ts`, les tests.

## 3. Explication bloc par bloc

```ts
facile:    { simulations: 100,  worlds: 2, mistakeRate: 0.25, thinkMs: [1200, 2400] },
moyen:     { simulations: 500,  worlds: 5, mistakeRate: 0.10, thinkMs: [900, 1900] },
difficile: { simulations: 2000, worlds: 8, mistakeRate: 0,    thinkMs: [700, 1500] },
```

- `worlds` : combien de mains adverses **imaginées** sont explorées (l'IA ne voit pas la vraie) ;
- `simulations` : itérations MCTS par monde ;
- `mistakeRate` : probabilité de jouer un coup sensé au hasard au lieu du meilleur ;
- `thinkMs` : pause avant chaque coup (min, max).

## 4. Flux concret

Partie en « moyen » : chaque coup = 5 recherches de 500 simulations, 10 % de chances d'erreur
volontaire, 0,9 à 1,9 s de réflexion.

## 5. Points d'attention

- Le coût CPU d'un coup est proportionnel à `simulations × worlds`.

## 6. Questions probables en évaluation

- **Qu'est-ce qui différencie les difficultés ?** Effort de recherche, taux d'erreur, vitesse.
