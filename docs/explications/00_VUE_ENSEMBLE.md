# Vue d'ensemble du projet

> Public : un étudiant qui doit **défendre et modifier** ce code en évaluation. Commence par ce
> fichier, puis suis l'« ordre de lecture conseillé » en bas. Chaque fichier source a sa propre
> page dans ce dossier, au même chemin : `app/lib/auth.ts` → `app/lib/auth.ts.md`.

## 1. Ce que fait le projet

**ft_transcendence** est un jeu de cartes à collectionner en ligne (dans l'esprit de
Hearthstone) :

- on crée un compte (email + mot de passe, ou « Sign in with 42 ») ;
- on ouvre des **paquets** pour obtenir des cartes, on construit des **decks** ;
- on joue des parties **contre l'IA** (3 difficultés) ou **contre un autre joueur** en temps réel,
  sur deux machines différentes ; le serveur arbitre chaque coup ;
- autour du jeu : **amis**, **chat privé**, **présence en ligne**, **profils publics** avec avatar,
  **classement Elo**, **succès (dos de cartes à débloquer)**, **historique des parties**.

## 2. Les conteneurs

Tout se lance avec `make` (docker compose). Six services :

```mermaid
flowchart LR
    B[Navigateur] -- "HTTPS / WSS :8080 (dev) ou :443 (prod)" --> P[proxy<br/>nginx TLS]
    P -- "/  (pages, API)" --> A[app<br/>Next.js :3000]
    P -- "/socket.io/  (jeu)" --> G[game_engine<br/>Node + socket.io :4000]
    P -- "/chat-socket.io/  (chat, présence)" --> S[socketio<br/>socket-server :4000]
    A -- Prisma --> D[(db<br/>PostgreSQL)]
    G -- Prisma --> D
    A -- "présence (lecture)<br/>événements (émetteur)" --> R[(redis)]
    G -- "présence « en partie »<br/>événements (émetteur)" --> R
    S -- "présence + adaptateur socket.io" --> R
    S -- "GET /api/auth/me<br/>(qui est ce cookie ?)" --> A
```

| Service | Dossier | Rôle |
|---|---|---|
| `proxy` | `proxy/` | Seul point d'entrée. Termine TLS (certificat auto-signé généré au build), redirige HTTP → HTTPS, ajoute les en-têtes de sécurité, route vers les 3 services. |
| `app` | `app/` | Next.js 16 : toutes les pages (React), les routes API (`app/app/api/**/route.ts`), les *server actions* (connexion, inscription, profil). Lance les migrations et le seed au démarrage. |
| `game_engine` | `game_engine/` | Serveur de jeu **autoritaire** : règles, IA (MCTS), parties PvP, reconnexion, enregistrement des résultats. |
| `socketio` | `socket-server/` | Chat et présence : un socket par onglet connecté, rooms par utilisateur, présence dans Redis. |
| `db` | — | PostgreSQL 16, accédé uniquement via Prisma. |
| `redis` | — | Présence en ligne + bus d'événements temps réel entre services. |

En dev (`make`), le code est monté dans les conteneurs (rechargement à chaud) et le site est sur
**https://localhost:8080**. En prod (`make prod`), images optimisées, site sur le port 443.

## 3. Parcours d'une requête HTTP

Exemple : l'utilisateur ouvre la page d'un joueur, `/users/alice`.

```mermaid
sequenceDiagram
    participant B as Navigateur
    participant N as nginx (proxy)
    participant P as page.tsx (Server Component)
    participant L as lib/profile.ts
    participant DB as PostgreSQL
    participant R as Redis
    B->>N: GET https://…/users/alice (cookie session)
    N->>P: proxy_pass http://app:3000
    P->>P: getSession() — vérifie le JWT + tokenVersion (lib/session.ts)
    alt pas de session
        P-->>B: redirect("/")
    end
    P->>L: getPublicProfile("alice", viewerId)
    L->>DB: Prisma : user, dos gagnés, 10 dernières parties, relation d'amitié
    L->>R: présence (HMGET presence:online, SMISMEMBER presence:ingame)
    L-->>P: profil public (jamais l'email)
    P-->>B: HTML rendu côté serveur + composant client PublicProfileView
```

Les routes API suivent le même schéma : `requireSession()` (lib/api.ts) → validation zod du corps
(`parseJsonBody`) → logique dans `lib/*.ts` → Prisma → réponse JSON `{ … }` ou `{ error }`.

## 4. Parcours d'un message WebSocket (chat)

Exemple : Alice envoie « salut » à Bob, son ami.

```mermaid
sequenceDiagram
    participant A as Navigateur d'Alice
    participant API as app — POST /api/messages/:bobId
    participant DB as PostgreSQL
    participant R as Redis
    participant S as socket-server
    participant Bb as Navigateur(s) de Bob
    A->>API: fetch POST { content: "salut" }
    API->>API: session, zod (1–500 caractères), limite de débit, amis ?
    API->>DB: INSERT Message
    API->>R: émetteur socket.io → rooms user:alice, user:bob
    R->>S: adaptateur Redis
    S->>Bb: event "chat:message"
    S->>A: event "chat:message" (ses autres onglets)
    API-->>A: 201 { message }
```

Le serveur de chat ne touche jamais la base : il authentifie chaque connexion en demandant à
l'app `GET /api/auth/me` avec le cookie reçu, puis il se contente de relayer vers des *rooms*.

## 5. Boucle de jeu serveur ↔ clients

Le **serveur décide de tout** ; le client n'envoie que des intentions et anime ce qu'on lui dit.

```mermaid
sequenceDiagram
    participant C as Client Phaser (InputController)
    participant EM as EventManager (socket.io-client)
    participant SS as serverSocket.ts
    participant GS as GameSession
    participant GE as GameEngine
    C->>EM: client:playCard { cardId, boardIndex }
    EM->>SS: socket "message" { type: "playCard", … }
    SS->>GS: (handler lié au siège du joueur)
    GS->>GS: isWellFormed ? son tour ? carte dans sa main ? cible légale ?
    alt refus
        GS-->>EM: { type: "rejected", reason }
    else accepté
        GS->>GE: playCard(...) → règles, effets, morts
        GE-->>GS: événements d'animation
        GS-->>EM: { type: "event", … } (aux 2 joueurs)
        GS-->>EM: { type: "state", state } (vue propre à chaque joueur)
    end
    EM->>C: server:event → AnimationQueue , server:state → StateSyncController
```

- **Contre l'IA** : après chaque fin de tour humaine, `GameSession.runAiTurnLoop` fait jouer l'IA
  (`ai/policy.ts` → recherche MCTS `ai/mcts.ts`), avec un temps de réflexion entre chaque coup.
- **Déconnexion** : le siège est gardé **30 s** (`RECONNECT_GRACE_MS`), l'adversaire est prévenu ;
  si le joueur revient (même compte), `reattach()` lui rend sa partie ; sinon **forfait**.
- **Fin de partie** : `finish()` enregistre le résultat en une transaction (`matchResults.ts` :
  victoires, paquets, dos de carte, Elo, historique) puis envoie `gameOver` avec les récompenses.

## 6. Flux OAuth 42

```mermaid
sequenceDiagram
    participant B as Navigateur
    participant A as app
    participant I as intra 42
    B->>A: GET /api/auth/42  (bouton « Sign in with 42 »)
    A->>B: cookie ft_oauth_state = UUID aléatoire , 302 → intra 42 /oauth/authorize?state=UUID
    B->>I: page d'autorisation 42
    I->>B: 302 → /api/auth/42/callback?code=…&state=UUID  (ou ?error=access_denied)
    B->>A: GET /callback (avec le cookie)
    A->>A: state == cookie ? (sinon ?error=oauth — protection CSRF)
    A->>I: POST /oauth/token (code + client_secret) puis GET /v2/me
    I-->>A: { id, login, email }
    A->>A: compte avec ce fortyTwoId ? sinon création (jamais de liaison par email)
    A->>B: cookie session (JWT) , 302 → /
```

Liaison d'un compte existant : depuis `/profile`, bouton « Link 42 account » →
`/api/auth/42?link=1` ; au retour, le `fortyTwoId` est posé sur le compte **connecté**.

## 7. Schéma de la base

```mermaid
erDiagram
    User ||--o{ Deck : "possède"
    User ||--o{ UserCard : "collection"
    Card ||--o{ UserCard : ""
    Deck ||--o{ DeckCard : "contient"
    Card ||--o{ DeckCard : ""
    User ||--o{ Friendship : "demandeur"
    User ||--o{ Friendship : "destinataire"
    User ||--o{ Message : "envoie"
    User ||--o{ Message : "reçoit"
    User ||--o{ MatchPlayer : "joue"
    Match ||--|{ MatchPlayer : "sièges humains"

    User {
        int id PK
        string email UK
        string username UK
        string password "hash argon2id, null si 42 seul"
        int fortyTwoId UK
        int tokenVersion "révocation des sessions"
        string avatar "nom du fichier"
        int elo
        int unopenedPacks
        int[] unlockedCardBacks "dos débloqués = succès"
    }
    Card {
        string id PK
        string name
        string rarity
        string cost
        json battlecry "effets en JSON"
        int qty "copies max par joueur"
    }
    UserCard {
        int userId PK
        string cardId PK
        int qty
    }
    Deck {
        int id PK
        string name
        int userId FK
    }
    DeckCard {
        int deckId PK
        string cardId PK
        int qty
    }
    Friendship {
        int id PK
        int requesterId FK
        int addresseeId FK
        enum status "PENDING | ACCEPTED | BLOCKED"
    }
    Message {
        int id PK
        int senderId FK
        int recipientId FK
        string content "500 max"
    }
    Match {
        int id PK
        enum mode "PVP | AI_EASY | AI_MEDIUM | AI_HARD"
        string endReason "hero | forfeit"
    }
    MatchPlayer {
        int matchId PK
        int userId PK
        bool won
        int eloChange
    }
```

La présence en ligne n'est **pas** en base : elle vit dans Redis (voir `app/lib/presence.ts`).

## 8. Sécurité en un coup d'œil

| Menace | Protection | Où |
|---|---|---|
| Écoute réseau | HTTPS/WSS partout, cookies `Secure` | `proxy/`, `lib/session.ts` |
| Vol de mot de passe en base | argon2id salé | `lib/auth.ts`, `lib/constants.ts` |
| Force brute | limite des échecs par compte et par IP | `lib/rateLimit.ts` |
| Session volée | JWT signé, `HttpOnly`, révocation par `tokenVersion` au changement de mot de passe | `lib/session.ts`, `lib/updateUserProfile.ts` |
| CSRF | cookie `SameSite=Lax`, *server actions* vérifiées par Next (Origin), `state` OAuth | `lib/session.ts`, `api/auth/42` |
| Détournement de WebSocket | vérification de l'`Origin` sur les deux serveurs socket | `game_engine/srcs/socket/serverSocket.ts`, `socket-server/index.js` |
| Entrées malveillantes | schémas zod client + serveur, validation des messages de jeu | `lib/validation.ts`, `socket/validateMessage.ts` |
| Triche | serveur autoritaire, decks vérifiés contre la collection | `socket/gameSession.ts`, `lib/decks.ts` |
| Injection SQL | Prisma (requêtes paramétrées, y compris le SQL brut taggé) | partout |
| XSS | React échappe tout, aucun `dangerouslySetInnerHTML` ; avatars servis avec type fixé + `nosniff` + CSP sandbox | `api/avatars/[file]` |
| Upload dangereux | type détecté par signature binaire, 2 Mo, nom aléatoire, hors racine web | `lib/avatarStorage.ts` |

## 9. Ordre de lecture conseillé

1. `docker-compose.yml`, `Makefile`, `proxy/dev.conf` — comment tout démarre.
2. `app/prisma/schema.prisma` — les données.
3. `app/lib/session.ts`, `app/lib/auth.ts`, `app/lib/validation.ts` — l'authentification.
4. `app/app/layout.tsx`, `app/app/page.tsx`, `app/app/HubBackground.tsx` — l'interface.
5. `app/lib/api.ts` puis une route simple : `app/app/api/friends/route.ts`, puis `app/lib/friends.ts`.
6. `app/components/realtime/RealtimeProvider.tsx`, `socket-server/index.js`, `app/lib/realtime.ts` — le temps réel.
7. `game_engine/srcs/index.ts` → `socket/serverSocket.ts` → `socket/gameSession.ts` → `gameEngine.ts` — le jeu.
8. `game_engine/srcs/card.ts`, `effect.ts`, `target.ts`, `cardImport/effectFactory.ts` — les cartes.
9. `game_engine/srcs/ai/policy.ts` → `ai/mcts.ts` → `ai/tree.ts` — l'IA.
10. `app/game/EventManager.ts` → `scenes/GameScene.ts` → `scenes/gameProcessors/*` — le client de jeu.

Voir aussi : [01_MODULES.md](01_MODULES.md) (modules du sujet et comment les démontrer) et
[02_MODIFICATIONS_EVAL.md](02_MODIFICATIONS_EVAL.md) (modifications fréquentes en évaluation).
