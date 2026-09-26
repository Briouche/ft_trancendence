# `socket-server/index.js`

> Service : **socketio** (chat & présence) · JavaScript (ESM) · ~170 lignes · tout le service.

## 1. Rôle

Serveur socket.io dédié au **temps réel hors jeu** (chemin `/chat-socket.io/`) :

- chaque onglet d'un utilisateur connecté ouvre **une** connexion ; elle rejoint la room
  `user:<id>` ;
- l'application pousse les **messages de chat** et les **changements d'amitié** vers ces rooms
  (via Redis, sans connexion directe) ;
- il tient la **présence en ligne** (compteur de connexions par utilisateur dans Redis) et
  prévient uniquement les clients qui affichent l'utilisateur concerné.

Il ne touche **jamais** la base : les messages sont validés et enregistrés par l'application.

## 2. Dépendances

- **Importe** : `http`, `socket.io`, `@socket.io/redis-adapter`, `ioredis`.
- **Appelle** : `GET http://app:3000/api/auth/me` (authentification).
- **Clients** : `app/components/realtime/RealtimeProvider.tsx` (navigateur) ; émetteurs Redis de
  `app/lib/realtime.ts` et `game_engine/srcs/presence.ts`.

## 3. Explication bloc par bloc

### Connexions Redis

```js
const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate();   // l'abonnement Redis bloque une connexion
const redis = pubClient.duplicate();       // commandes de présence
io.adapter(createAdapter(pubClient, subClient));
```

L'**adaptateur Redis** fait que tout message publié dans Redis au format socket.io (par l'émetteur
de l'app ou du jeu) est livré aux sockets de ce serveur.

### `isSameOrigin` (allowRequest)

Même contrôle que le serveur de jeu : l'`Origin` doit correspondre à l'hôte contacté, sinon un
site tiers pourrait ouvrir un socket avec le cookie de la victime.

### Authentification

```js
const res = await fetch(`${APP_INTERNAL_URL}/api/auth/me`, { headers: { cookie: cookieHeader }, signal: AbortSignal.timeout(15000) });
if (!res.ok) return null;                        // pas connecté ou session révoquée
```

On transmet le cookie du handshake à l'application, qui fait **exactement** ses vérifications
habituelles (signature, expiration, `tokenVersion`). Avantage : pas de secret JWT ni de base dans
ce service, et une seule logique d'authentification.

### Présence

- Connexion : `HINCRBY presence:online <id> 1` ; si le résultat vaut 1 (premier onglet) → annonce.
- Déconnexion : `HINCRBY … -1` ; à 0 → suppression + annonce « offline ».
- `presenceOf(id)` : `in_game` si le serveur de jeu l'a marqué, sinon `online` si compteur > 0,
  sinon `offline`.
- `announce(id)` : `io.to("presence:<id>").emit("presence", { userId, presence })`.

### `presence:watch` / `presence:unwatch`

Le client envoie la liste des utilisateurs qu'il affiche (200 max, entiers positifs) ; le socket
quitte les anciennes rooms `presence:*`, rejoint les nouvelles et reçoit tout de suite leur
présence (accusé de réception). **Pourquoi** : éviter de diffuser chaque changement de présence à
tout le monde.

### Démarrage

`await redis.del(ONLINE_KEY)` : les compteurs d'une exécution précédente sont faux (ses sockets
n'existent plus). Hypothèse : une seule instance de ce service.

## 4. Flux concret

Alice ouvre le site : `RealtimeProvider` se connecte → authentifiée via `/api/auth/me` → room
`user:1` → compteur 1 → les clients qui regardent Alice (`presence:1`) reçoivent « online ». Bob,
sur `/friends`, voit la pastille passer au vert.

## 5. Points d'attention

- Si l'application est lente à répondre (compilation à la demande en dev), la connexion attend
  jusqu'à 15 s.
- Le compteur est protégé contre les valeurs négatives (`<= 0` → suppression).

## 6. Questions probables en évaluation

- **Comment fonctionne le chat en temps réel ?** L'app enregistre le message puis le publie dans
  Redis ; ce serveur, via son adaptateur Redis, le livre aux rooms des deux participants.
- **Comment sais-tu qu'un utilisateur est en ligne ?** Il a au moins un onglet connecté à ce
  serveur (compteur Redis).
- **Pourquoi ne pas tout diffuser à tout le monde ?** Coût et confidentialité : rooms ciblées.
