# `game_engine/srcs/socket/gameSession.ts`

> Service : **game_engine** · TypeScript · ~730 lignes · une partie en cours, de bout en bout.

## 1. Rôle

Une instance de `GameSession` = **une partie**. Elle fait le lien entre les sockets des joueurs
et le moteur de règles (`GameEngine`) :

- elle **valide** chaque message reçu (bon joueur, son tour, carte dans sa main, cible légale) ;
- elle **applique** le coup au moteur ;
- elle **diffuse** les événements d'animation et l'état (une vue différente par joueur) ;
- elle fait **jouer l'IA** quand c'est son tour ;
- elle gère la **déconnexion / reconnexion** (fenêtre de grâce de 30 s, puis forfait) ;
- elle **termine** la partie une seule fois et enregistre le résultat.

C'est ce qui fait du serveur un **moteur autoritaire** : le client envoie des intentions, la
session décide.

## 2. Dépendances

- **Importe** : `gameEngine.ts` (moteur, `Action`, `AnimationEvent`), `socket.io` (type
  `Socket`), `player.ts`, `shared/protocol.ts` (messages), `toClientState.ts` (vues par joueur),
  `card.ts`, `effect.ts`, `target.ts` (cibles d'attaque), `ai/policy.ts` (coups de l'IA,
  temps de réflexion), `ai/types.ts` (`Difficulty`), `matchResults.ts` (enregistrement),
  `presence.ts` (statut « en partie »), `validateMessage.ts` (forme des messages).
- **Utilisé par** : `socket/serverSocket.ts` (crée les sessions, retrouve celle d'un joueur).

## 3. Explication bloc par bloc

### `Seat` et constantes

```ts
export type Seat = { kind: "human"; socket: Socket; userId: number } | { kind: "ai" };
const RECONNECT_GRACE_MS = 30_000;
```

Un siège humain est lié à un **compte** (`userId`) et pas seulement à une connexion : c'est ce
qui permet de rendre la partie à un joueur qui revient avec un nouveau socket.

### Constructeur

Crée le moteur avec les deux joueurs, **lie les handlers** des sockets humains
(`bindHandlers`), envoie `assigned` (« tu es le joueur 0/1 »), démarre la partie
(`engine.startGame()`), diffuse les premiers événements et l'état, marque les humains « en
partie » dans Redis (`setInGame`) et lance la boucle de l'IA (qui ne fait rien si ce n'est pas
son tour).

### `handle(playerIndex, msg)` — le filtre de tous les messages en jeu

```ts
if (this.gameOver || !isWellFormed(msg)) return;
if (msg.type === "quit") { this.forfeit(playerIndex); return; }
if (playerIndex !== this.engine.currentTurn) { this.reject(playerIndex, "not your turn"); return; }
if (this.pending !== null && msg.type !== "targetChoice") { this.reject(..., "waiting for target"); return; }
switch (msg.type) { case "playCard": … case "attack": … case "endTurn": … case "targetChoice": … }
```

L'ordre compte : message mal formé ignoré → abandon toujours permis → sinon il faut que ce soit
son tour → et si une cible est attendue, seul `targetChoice` est accepté.

### `handlePlayCard` / `beginTargeting` / `handleTargetChoice`

1. La carte doit être **dans la main du joueur** (recherche par id) ; un `boardIndex` hors du
   plateau est refusé.
2. Si l'effet de la carte demande une cible : calcul des **cibles légales** ; aucune → un sort est
   refusé, un cri de guerre se joue à vide ; sinon `beginTargeting` mémorise l'attente
   (`this.pending`, avec les options par id) et envoie un `prompt` au joueur.
3. `handleTargetChoice` : la cible doit être dans les options proposées **et encore légale**
   (l'état a pu changer) ; `null` = annulation (sort annulé, serviteur posé sans cri de guerre).
4. `engine.playCard(...)`, puis diffusion `cardPlayed` + événements + états, puis
   `checkGameOver()`.

### `handleAttack`

L'attaquant doit être un serviteur **du joueur** et pouvoir attaquer ; la cible doit être dans la
liste d'`EnemyCharacterResolver` (provocation, règle « rush »). Puis `engine.attackWithMinion`.

### `handleEndTurn` et `runAiTurnLoop`

La fin de tour diffuse `turnEnded` + événements de fin/début de tour, puis appelle la boucle de
l'IA :

```ts
while (!this.gameOver && this.seats[this.engine.currentTurn].kind === "ai") {
    await this.delay(thinkingTime(this.difficulty));     // rythme humain
    if (this.gameOver) break;
    try { this.applyAiAction(await chooseAiAction(this.engine, this.difficulty)); }
    catch (err) { … this.applyAiAction({ type: "endTurn" }); }  // une IA en panne ne bloque jamais la partie
}
```

`applyAiAction` traduit une `Action` d'index (celle de l'IA) en appel au moteur, exactement comme
pour un humain, et diffuse les mêmes messages.

### Fin de partie : `checkGameOver`, `forfeit`, `finish`

`checkGameOver` (après chaque action) et `forfeit` (abandon ou délai dépassé) appellent tous deux
`finish(winnerIndex, reason)` :

```ts
if (this.gameOver) return;           // une seule fin, quoi qu'il arrive
this.gameOver = true;
this.clearDisconnectTimers();
recordMatch(mode, reason, humans)    // transaction : victoires, paquets, dos de carte, Elo, historique
    .catch(() => new Map())          // en cas d'échec : on annonce quand même le résultat
    .then(rewards => { sendGameOver(gagnant, "you", rewards); sendGameOver(perdant, "opponent", rewards);
                       setInGame(humans, false); this.onGameEnd(); });
```

Le résultat est **enregistré avant** l'envoi de `gameOver`, pour que l'écran de fin affiche les
récompenses réellement stockées.

### Déconnexion : `handleDisconnect`, `reattach`, `hasSocket`, `hasUser`

- `handleDisconnect(socket)` : retrouve le siège de **ce** socket (comparaison d'objet, pas d'id,
  voir points d'attention), lance un minuteur de 30 s qui appellera `forfeit`, et prévient
  l'adversaire (`opponentDisconnected`, avec les secondes restantes).
- `reattach(userId, socket)` : appelé par `serverSocket` quand le même **compte** revient.
  Annule le minuteur, branche le nouveau socket sur le siège (sans double branchement), renvoie
  `assigned` + l'état complet (y compris une cible en attente via `promptFor`), et prévient
  l'adversaire (`opponentReconnected`).

### Traductions

- `targetToOption` : cible du moteur → `{ type: "hero"|"minion", id }` du protocole.
- `broadcastAnimationEvents` : `AnimationEvent` du moteur → messages `event` du protocole.
- `promptFor` : reconstruit la demande de cible en cours pour l'inclure dans l'état (un client qui
  se reconnecte au milieu d'un ciblage sait qu'il doit encore choisir).

## 4. Flux concret

« Bob ferme son onglet en pleine partie puis revient 10 s plus tard » :
1. socket.io signale `disconnect` → `serverSocket` appelle `game.handleDisconnect(socket)`.
2. Minuteur de 30 s ; Alice reçoit `opponentDisconnected { secondsRemaining: 30 }` et voit un
   bandeau.
3. Bob rouvre la page : son client envoie `ready`/`resume` ; `serverSocket` voit que son compte a
   une partie (`hasUser`) et appelle `reattach(bobId, nouveauSocket)`.
4. Minuteur annulé, Bob reçoit l'état complet et reprend ; Alice reçoit `opponentReconnected`.
5. S'il ne revient pas : au bout de 30 s, `forfeit(siègeDeBob)` → `finish` → Alice gagne.

## 5. Points d'attention

- **Objet socket et non id** : avec la reprise d'état de socket.io, un socket récupéré peut
  revenir avec le **même id** que l'ancien ; seule la comparaison d'objets distingue « la
  connexion actuelle » de « celle qui vient de mourir ».
- `finish` est le **seul** chemin de fin : tout ajout (ex. un nouveau type de fin) doit passer
  par lui pour ne jamais enregistrer deux résultats.
- `handlePlayCard` est `async` mais ne fait pas d'`await` après ses vérifications : l'ordre des
  messages est donc garanti par la boucle d'événements de Node (pas de course entre deux coups).
- `this.difficulty` n'a de sens que contre l'IA (la valeur par défaut « moyen » est ignorée en PvP).

## 6. Questions probables en évaluation

- **Comment empêches-tu un joueur de jouer à la place de l'autre ?** Chaque socket est
  authentifié (cookie de session) et lié à **son** siège ; le handler reçoit `playerIndex` fixé au
  branchement, jamais pris dans le message.
- **Et s'il envoie une carte qu'il n'a pas ?** Refusée : on la cherche dans **sa** main côté
  serveur (`card not in hand`).
- **Comment gères-tu la déconnexion ?** Fenêtre de grâce de 30 s, adversaire prévenu, reprise
  exacte via `reattach`, forfait sinon.
- **Pourquoi l'IA attend-elle entre ses coups ?** Rythme humain et animations lisibles
  (`thinkingTime`, 0,7 à 2,4 s selon la difficulté).
- **Que se passe-t-il si l'IA plante ?** Son tour est terminé de force, la partie continue.
- **Quand les récompenses sont-elles données ?** Dans `finish`, par `recordMatch` (une
  transaction), avant d'annoncer la fin.
