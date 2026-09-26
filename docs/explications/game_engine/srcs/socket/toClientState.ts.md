# `game_engine/srcs/socket/toClientState.ts`

> Service : **game_engine** · TypeScript · ~120 lignes · état du moteur → vue d'un joueur.

## 1. Rôle

Transforme l'état interne du moteur en **ce qu'un joueur a le droit de voir**, au format du
protocole (`ClientGameState`), et une carte en `ClientCard`.

## 2. Dépendances

- **Importe** : `card.ts`, `gameEngine.ts`, `effect.ts` (pour reconnaître `cleave` et
  `regeneration`), `shared/protocol.ts`, `player.ts`.
- **Utilisé par** : `socket/gameSession.ts`.

## 3. Explication bloc par bloc

- `requiresTarget(card)` : vrai si le sort ou le cri de guerre demande une cible (le client
  affichera la flèche de ciblage).
- `toClientCard(card)` : id, nom, image, rareté, coût, description ; pour un serviteur : stats
  actuelles et de base, `canAttack`, et les **icônes** de mots-clés (provocation, râle, etc.).
- `toClientHero(player)` : PV, nom, id, dos de carte, et le compteur du passif de légendaire.
- `toClientState(engine, playerIndex, pendingPrompt)` :

```ts
playerHand: engine.players[playerIndex].hand.getCards().map(toClientCard),
opponentHandCount: engine.players[opponentIndex].hand.size(),   // jamais les cartes adverses
…
pendingPrompt   // la cible qu'il doit encore choisir (utile après une reconnexion)
```

## 4. Flux concret

Après chaque action, `GameSession.broadcastState()` appelle `toClientState(engine, 0, …)` et
`toClientState(engine, 1, …)` : chaque joueur reçoit une vue différente.

## 5. Points d'attention

- Ajouter une info à l'écran = l'ajouter au type dans `protocol.ts` (les deux copies) + ici.

## 6. Questions probables en évaluation

- **Comment évites-tu de révéler la main adverse ?** La vue est construite par joueur ; on
  n'envoie que la taille de la main adverse.
