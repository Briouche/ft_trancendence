# `game_engine/srcs/shared/protocol.ts`

> Service : **game_engine** (copie identique : `app/game/shared/protocol.ts`) · TypeScript ·
> ~120 lignes · le contrat entre le client de jeu et le serveur.

## 1. Rôle

Définit **tous les messages** échangés sur le socket de jeu, et la forme de l'état envoyé au
client. Il n'y a que des types : aucun code exécuté.

Il existe en **deux copies identiques** parce que chaque service est construit depuis son propre
dossier (Docker). Règle : modifier l'une, recopier sur l'autre, `diff` ne doit rien afficher.

## 2. Dépendances

- **Importe** : rien.
- **Utilisé par** : `socket/serverSocket.ts`, `socket/gameSession.ts`, `socket/toClientState.ts`,
  `socket/validateMessage.ts`, `matchResults.ts` ; côté client `app/game/EventManager.ts`,
  `app/game/scenes/**`.

## 3. Explication bloc par bloc

- `ClientCard`, `ClientHero`, `ClientGameState` : la **vue d'un joueur** (sa main complète, le
  **nombre** de cartes adverses seulement, les deux plateaux, mana, decks, cible en attente).
- `GameEvent` : les événements à animer (`attack`, `damage`, `heal`, `buff`, `cardPlayed`,
  `summon`, `minionDied`, `effect`, `turnEnded`, `cardDrawn`).
- `ClientMessage` (client → serveur) : `ready`, `readySolo`, `playCard`, `attack`,
  `targetChoice`, `endTurn`, `resume`, `quit`.
- `ServerMessage` (serveur → client) : `assigned`, `state`, `event`, `prompt`, `rejected`
  (`fatal` = plus de partie possible), `opponentDisconnected`, `opponentReconnected`,
  `gameOver` (avec `rewards` : paquets, variation d'Elo, dos de carte débloqué).

## 4. Flux concret

Le client envoie `{ type: "attack", attackerId: "hey12_3", targetId: "hero-1" }` ; le serveur
répond `{ type: "event", event: { type: "attack", … } }`, des `damage`, puis un `state` complet.

## 5. Points d'attention

- Le client ne reçoit **jamais** la main de l'adversaire (seulement `opponentHandCount`) : pas de
  triche possible en lisant le trafic réseau.
- Les messages client ne sont pas fiables pour autant : ils sont validés
  (`socket/validateMessage.ts`) avant usage.

## 6. Questions probables en évaluation

- **Que voit le client de la main adverse ?** Uniquement le nombre de cartes.
- **Comment le client et le serveur s'accordent-ils sur les messages ?** Ce fichier, partagé à
  l'identique.
