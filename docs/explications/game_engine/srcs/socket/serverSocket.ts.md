# `game_engine/srcs/socket/serverSocket.ts`

> Service : **game_engine** · TypeScript · ~310 lignes · le serveur socket.io du jeu.

## 1. Rôle

Crée le serveur socket.io du jeu (port 4000, chemin par défaut `/socket.io/`, que nginx expose en
`wss://…/socket.io/`) et gère tout ce qui se passe **avant et autour** d'une partie :

- refuser les connexions venant d'un autre site (vérification de l'`Origin`) ;
- **authentifier** chaque connexion avec le cookie de session ;
- démarrer une partie **solo** (contre l'IA) ;
- gérer la **file d'attente** multijoueur et apparier deux joueurs ;
- rendre sa partie à un joueur qui revient (reconnexion) ;
- réagir aux déconnexions.

Une fois la partie créée, c'est `GameSession` qui prend la main.

## 2. Dépendances

- **Importe** : `socket.io`, `http` (type de requête), `player.ts`, `hero.ts`, `deck.ts`,
  `gameSession.ts`, `shared/protocol.ts`, `cardImport/cardLoader.ts` (decks depuis la base),
  `cardImport/aiDecks.ts` (decks de l'IA), `auth/session.ts` (authentification),
  `validateMessage.ts` (`isDeckId`, `isDifficulty`).
- **Utilisé par** : `index.ts` (`createGameServer(4000)`).

## 3. Explication bloc par bloc

### Petites fonctions

- `clampCardBack` : un dos de carte invalide envoyé par le client devient 0 (il est purement
  cosmétique, pas besoin de refuser la partie).
- `randomCardBack` : le dos de carte de l'IA.
- `isSameOrigin(req, callback)` : passée à socket.io comme `allowRequest`.

```ts
const origin = req.headers.origin;
if (!origin) return callback(null, true);                  // client non navigateur : il lui faudra quand même le cookie
originHost = new URL(origin).host;                          // "localhost:8080"
callback(…, originHost === req.headers.host);               // même site que celui contacté ?
```

**Pourquoi** : une connexion WebSocket n'est pas soumise au CORS. Sans ce contrôle, n'importe quel
site pourrait ouvrir un socket vers notre serveur, et le navigateur y joindrait le cookie de
session de la victime (*cross-site WebSocket hijacking*) → jouer à sa place.

### `createGameServer(port)`

```ts
const io = new Server(port, { allowRequest: isSameOrigin, connectionStateRecovery: {} });
const waiting: WaitingPlayer[] = [];     // file d'attente multijoueur
const liveGames: GameSession[] = [];     // parties en cours
const starting = new Set<number>();      // comptes dont la partie est en cours de création
```

`connectionStateRecovery` : socket.io tente de restaurer une connexion coupée brièvement (les
messages manqués sont rejoués).

### Middleware d'authentification (`io.use`)

Avant tout message, `authenticateCookieHeader(handshake.headers.cookie)` vérifie le JWT et le
`tokenVersion` en base (`auth/session.ts`). Échec → la connexion est refusée avec
`unauthenticated` (le client affiche « Session expired »). Succès → l'identité est rangée dans
`socket.data.identity`.

### Messages avant/hors partie

- **`resume`** : le client se reconnecte → `resumeExisting` cherche la partie de ce **compte**
  (`hasUser`) et appelle `reattach`. Rien trouvé → rejet `fatal` (« Match not found »).
- **`readySolo`** :
  1. si une création est déjà en cours pour ce compte, ou s'il a déjà une partie → rien de
     nouveau (le client envoie `ready` deux fois, voir points d'attention) ;
  2. `isDifficulty` et `isDeckId` sinon « Invalid request » ;
  3. chargement en parallèle du deck du joueur (**vérifié** : il lui appartient et il possède les
     cartes) et d'un deck d'IA au hasard ;
  4. pile ou face pour savoir qui commence, création de la `GameSession` (un siège humain, un
     siège IA), ajout dans `liveGames` ; `onGameEnd` la retirera de la liste.
- **`quit`** en file d'attente : retire le joueur de la file.
- **`ready`** (multijoueur) :
  1. mêmes gardes (création en cours, partie existante, `deckId` valide) ;
  2. déjà dans la file ? on met à jour son socket/deck au lieu de l'ajouter deux fois ;
  3. sinon ajout, puis recherche du plus ancien joueur **d'un autre compte** (on ne s'affronte pas
     soi-même avec deux onglets) ;
  4. pile ou face, chargement des deux decks, création de la session PvP.

### `disconnect`

Retire l'entrée de file **de ce socket uniquement** (le même compte a pu revenir avec un autre
socket entre-temps), et prévient la partie éventuelle (`handleDisconnect` → fenêtre de grâce).

## 4. Flux concret

Deux joueurs cliquent « Multiplayer » :
1. Alice : `ready { deckId: 4 }` → file = [Alice].
2. Bob : `ready { deckId: 7 }` → file = [Alice, Bob] → paire trouvée → les deux sont retirés de
   la file et marqués `starting`.
3. Decks chargés et vérifiés en parallèle ; pile ou face → `new GameSession(siège0, siège1, …)`.
4. Chacun reçoit `assigned` puis `state` : la partie commence.

## 5. Points d'attention

- **Double création** : le client envoie son `ready` à la fois quand la scène démarre et quand
  le socket se connecte. Le second message arrivait pendant le chargement des decks et créait une
  seconde partie sur le même socket (chaque coup était alors appliqué deux fois). Le `Set starting`
  l'empêche : ne pas le retirer.
- `CARD_BACK_COUNT` doit rester égal à celui de `app/lib/cardBacks.ts` (deux services séparés).
- Les parties vivent **en mémoire** : redémarrer `game_engine` les termine (et `index.ts` remet
  la présence « en partie » à zéro).
- Un seul processus `game_engine` : la file et les parties ne sont pas partagées entre instances.

## 6. Questions probables en évaluation

- **Comment le WebSocket de jeu est-il authentifié ?** Au handshake, par le cookie de session
  (JWT HS256 + `tokenVersion` vérifié en base), dans `io.use`.
- **Comment se fait le matchmaking ?** File FIFO : le nouveau venu est apparié au plus ancien
  joueur d'un autre compte ; l'ordre de jeu est tiré au sort.
- **Un joueur peut-il lancer deux parties ?** Non : `starting` + `resumeExisting` (un compte =
  une partie).
- **Et le CORS ?** Pas de CORS nécessaire (même origine via nginx) ; à la place, l'origine est
  vérifiée pour toutes les requêtes, WebSocket compris.
