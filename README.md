
*This project has been created as part of the 42 curriculum by brcoppie, fkrakow, lecartuy, stdevis*

## Description
ft_transcendence is a real-world web application built as a team project. We chose to make a [digital collectible card game](https://en.wikipedia.org/wiki/Digital_collectible_card_game).

To play, players must log in or register. Each player has their own card collection and uses it to build decks. With their decks, they can play against other players or an AI opponent of varying difficulty.

Key game features:
- **Packs**: players grow their collection by opening packs of 8 cards, drawn by rarity, with a pity counter that guarantees a legendary card after 5 packs without one.
- **Collection and decks**: players browse the cards they own and build their own decks from them.
- **Matches**: games against another player or against an AI opponent in Easy, Medium, or Hard difficulty.
- **Statistics and achievements**: wins are counted per opponent type, and winning against each opponent type or completing the full collection unlocks cosmetic card backs.

The game also includes *social* features: adding friends, user profiles, chats, and signing in with a 42 account.

The app is fully containerised and made up of six long-running services (in production, a seventh short-lived container copies the static files for the proxy, see **Containerised solution**):

1. an Nginx reverse proxy
2. a Next.js full-stack app
3. a Node.js game engine
4. a Socket.IO server
5. a Redis in-memory store
6. a PostgreSQL database

The full architecture and feature set are covered in the **Features and Modules** sections below (add links).

---
clearly presents the project, including its goal and a brief overview
also needs to contain a clear name for the project and its key features

## Instructions
### Prerequisites
- Docker with the Compose plugin (`docker compose`)
- `make`

### Steps
1. Set up the environment variables: copy `.env.example` to `.env` and fill in your own values. The `Makefile` includes `.env`, so `make` fails immediately if the file is missing. `FT_REDIRECT_URI` must be changed to `https://<DOMAIN_NAME>/api/auth/42/callback` in production and registered as a redirect URI on the 42 OAuth app.
2. Build and start the project with `make` (equivalent to `make dev`) for development, or `make prod` for production. We use separate environments because dev and prod builds have different requirements.
3. Open the app: `http://localhost:8080` in development, or `https://<DOMAIN_NAME>` in production. The production certificate is self-signed, so the browser shows a warning the first time.

Other `make` targets:
- `make clean` stops and removes the containers.
- `make fclean` does the same and also deletes the volumes, which **wipes the database**.
- `make ffclean` prunes every unused Docker image, volume, network, and build cache on the machine, not only this project's.
- `make re` runs `fclean` then starts the development build again.

### Development and production
In **development** we expose every service on its own port:

| Service | Port |
|---|---|
| proxy | 8080 |
| app | 3000 |
| game engine | 4000 |
| socket-server | 4001 |
| Redis | 6379 |
| PostgreSQL | 5432 |

The proxy accepts plain HTTP and supports Hot Module Replacement (HMR) for the Next.js app, which runs uncompiled. The source code is mounted as local volumes rather than baked into the containers, so changes are picked up immediately.

In **production** we expose only the proxy: port 443 for HTTPS, and port 80, which only redirects to HTTPS. The app and game engine are compiled and embedded directly into their containers instead of relying on mounted volumes. The proxy configuration is also more elaborate, serving static assets directly instead of routing them through the Node server.

---
any relevant information about compilation, installation, and/or execution
mention all the needed prerequisites (software, tools, versions, configuration like .env setup, etc.), and step-by-step instructions to run the project


## Resources

- https://nextjs.org/learn?utm_source=next-site&utm_medium=homepage-cta&utm_campaign=home: next js and tailwind css learning
- https://www.prisma.io/docs/guides/frameworks/nextjs: next js with prisma doc
- https://threejs.org/manual/#creating-a-scene: Three js doc for hub 3D
- https://phaser.io/tools/phaser-docs: Phaser3 documentation for the client-side game rendering
- https://socket.io/docs/v4/tutorial/introduction: sockets.io documentation
- https://en.wikipedia.org/wiki/Redis: redis database reference
- https://react.dev/learn/typescript: learning TypeScript and React
- https://medium.com/data-science/the-animated-monte-carlo-tree-search-mcts-c05bb48b018c: ai implemetation documentation
- https://en.wikipedia.org/wiki/Elo_rating_system: elo rating ref
- https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/: merging docker compose files

Textures used:
- https://crusenho.itch.io/complete-ui-book-styles-pack: used textures for hub and collection menus
- https://cafedraw.itch.io/fantasy-card-assets: card back assets
- https://argametina.itch.io/free-card-packs: card packs and pack opening aimation

AI use:
- Claude AI: To research sources, help debugging and design drafts. Help with complex merges and understanding each other's codebases. Used for tailwind CSS and Phaser3 coding. Refactoring code such as extracting a component in its own file. Used as a review collaborator.

---
list classics references related to the topic, as well as a description of how AI was used -- specifying for which tasks and which parts of the project


## Team Information
- **Product owners** — brcoppie, stdevis: responsible for the feature list and the game's look and feel.
- **Product manager** — fkrakow: tracks the project's progress.
- **Tech leads** — lecartuy, stdevis: responsible for the technologies and code quality.

Everyone on the team is also a developer: writing code for their assigned features, reviewing others' work, testing, and documenting.

---
for each team member present:
- assigned role(s): PO, PM, Tech Lead, Developers, etc
- brief description of their responsibilities

## Project Management
The work was split into five largely independent parts: Docker infrastructure, site design, game engine, AI opponent, and user management. We kept tabs through regular meetings and discussions, both in person and on Discord.

The order in which we implemented and integrated these parts is detailed in the **Features and Modules** sections below (add links). The four latter parts were developed in parallel with the Docker infrastructure connecting everything together. But the core of the project is the game and the *game state*...


## Technical Stack
The website is built on Next.js 16 and React 19, using Prisma 7 as the ORM and Socket.IO for WebSocket communication. Everything runs on Node 20. A Redis 7 service tracks online users for the real-time presence feature and carries chat messages from the app to the Socket.IO server **(we could also use it to cache game-engine state, but that isn't implemented yet)**.

Our database is PostgreSQL 16. We chose it because our data is relational: users, friendships, messages, cards, and decks all reference each other, and the collection and decks are join tables with a quantity (`UserCard`, `DeckCard`). PostgreSQL is also well supported by Prisma, and it supports arrays (`User.unlockedCardBacks`) and JSON columns (the card effects), which we use in the schema.

Other significant libraries: `jose` to sign and verify the session JWT, `@node-rs/argon2` to hash passwords, `ioredis` as the Redis client, and `socket.io-client` in the browser.

For styling we use React components with Tailwind CSS 4. The 3D graphics use three.js through React Three Fiber (`@react-three/fiber`) and its helpers `@react-three/drei` (`app/app/HubScene.tsx`, `app/components/home-library/`).

The game engine and the AI opponent are both written in TypeScript. The game engine (`game_engine/`) is a server with no rendering: it runs the game rules and the AI, holds all the deterministic logic and numbers and talks to the browser over Socket.IO. The game board is drawn in the browser with Phaser (`app/game/`: scenes, objects, and `EventManager.ts` for the connection between the game_engine and the phaser )

For the AI opponent, we use Monte Carlo Tree Search (MCTS) (`game_engine/srcs/ai/mcts.ts`). This algorithm is based on doing simulations of the game in the background based on the current game state and returns the best action. Since the AI can't see the opponent's hand, it builds several guessed versions of it (`game_engine/srcs/ai/determinize.ts`), takes a copy of the game_engine so it has acces to all the cards on the board the cards in his hand and the current hp of both sides. Then, it will run a tree search (`game_engine/srcs/ai/tree.ts`) with each node being a move and each time it finishes a simulation, it walks back up the tree by updating each node with wether it brought a win or not. Finally, returns the 'best action' based on which move across all the different simulations and guessed hands got the better score. The number of simulations and guessed hands depends on the difficulty (`DIFFICULTY_PRESETS` in `game_engine/srcs/ai/types.ts`).



## Database Schema
The main models are `User`, `Card`, and `Deck`. Around them, `Friendship` and `Message` hold the social features, and `UserCard` and `DeckCard` are the join tables for a user's collection and a deck's content. The schema also defines three enums: `UserStatus`, `FriendshipStatus`, and `Keyword`.

A `User` is identified by its id, and has an email and username. To sign in, it has a password, a `fortyTwoId` for 42-account sign-in, or both: when someone signs in with 42 and a local account already uses the same email, the 42 id is attached to that account (`app/lib/auth/oauth42.ts`). The `tokenVersion` is stored in every session cookie, and increasing it invalidates all of the user's existing sessions (see **Log in and Register**).
Additional fields include an avatar, status, creation date, a set of decks, a count of unopened packs, a pity counter, and win statistics. The user's card collection goes through `UserCard`, which stores how many copies of each card they own. `cardBack` is the card back they currently use, and `unlockedCardBacks` lists the ones they've unlocked.
Users can also send and receive friend requests, modelled as their own relation (`Friendship`), and send messages to each other (`Message`).

```
model User {
  id       Int    @id @default(autoincrement())
  // lowercase all email addresses and usernames when using them
  email    String @unique
  username String @unique

  // Nullable because OAuth-only accounts never set one
  password String?

  // 42 intra user id — set once the account is linked via "Sign in with 42".
  // Nullable/unique: some accounts won't have one, but no two can share the same.
  fortyTwoId Int? @unique

  // Used to logout-everywhere, password change, or suspected compromise
  // A JWT is only accepted if its embedded tokenVersion matches this value
  tokenVersion Int @default(0)

  avatar String?
  status UserStatus @default(OFFLINE)

  friendshipsSent     Friendship[] @relation("FriendshipRequester")
  friendshipsReceived Friendship[] @relation("FriendshipAddressee")

  messagesSent     Message[] @relation("MessageSender")
  messagesReceived Message[] @relation("MessageReceiver")

  createdAt     DateTime   @default(now())
  decks         Deck[]
  cards         UserCard[]
  unopenedPacks Int        @default(0)
  pityCounter   Int        @default(0)
  
  // Tracked separately per opponent type — see GameSession.recordResult (gameEngine), which
  // increments the right counter at the end of each game based on the opposing seat (AI + its
  // difficulty, or a real player).
  winsVsAiEasy   Int @default(0)
  winsVsAiMedium Int @default(0)
  winsVsAiHard   Int @default(0)
  winsVsPlayer   Int @default(0)
  
  // Index (0-7) into the cosmetic card-back catalog — see lib/cardBacks.ts.
  cardBack      Int        @default(0)
  // Unlocked card-back designs (indices 0-2 granted to everyone by default) — the remaining 5
  // (3-7) are each tied to a specific achievement, never granted by default or drawn from a pack
  // (see ACHIEVEMENT_CARD_BACKS in lib/cardBacks.ts and packs.ts).
  unlockedCardBacks Int[]  @default([0, 1, 2])
}

enum UserStatus {
  ONLINE
  OFFLINE
  IN_GAME
}

enum FriendshipStatus {
  PENDING
  ACCEPTED
  BLOCKED
}

model Friendship {
  id     Int              @id @default(autoincrement())
  status FriendshipStatus @default(PENDING)

  requesterId Int
  requester   User @relation("FriendshipRequester", fields: [requesterId], references: [id], onDelete: Cascade)

  addresseeId Int
  addressee   User @relation("FriendshipAddressee", fields: [addresseeId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([requesterId, addresseeId])
  @@index([requesterId])
  @@index([addresseeId])
}

// 1:1 chat between friends — no separate "conversation" model, a pair's
// history is just every row where they're sender/receiver in either direction.
model Message {
  id Int @id @default(autoincrement())

  senderId Int
  sender   User @relation("MessageSender", fields: [senderId], references: [id], onDelete: Cascade)

  receiverId Int
  receiver   User @relation("MessageReceiver", fields: [receiverId], references: [id], onDelete: Cascade)

  content   String
  createdAt DateTime @default(now())

  @@index([senderId, receiverId])
  @@index([receiverId, senderId])
}
```

A `Card` has many attributes...

```
model Card {
  id       String     @id
  assetKey String     @default("placeholder_card")
  artist   String?
  name     String
  type     String     @default("")
  rarity   String
  cost     String
  atk      String
  def      String
  desc     String
  qty      Int        @default(1)
  legendId String     @default("")
  decks    DeckCard[]

  taunt        Boolean?
  rush         Boolean?
  cannotAttack Boolean?
  archi        Boolean?
  spellpower   Int?

  battlecry         Json?
  deathrattle       Json?
  onAttack          Json?
  onDamage          Json?
  startOfTurnEffect Json?
  endOfTurnEffect   Json?
  spellEffect       Json?
  
  keywords Keyword[] @default([])
  owners   UserCard[]
}

model UserCard {
  userId Int
  cardId String
  qty    Int    @default(0)
  user   User   @relation(fields: [userId], references: [id])
  card   Card   @relation(fields: [cardId], references: [id])

  @@id([userId, cardId])
}

enum Keyword {
  RUEE
  RALE_DAGONIE
  CRI_DE_GUERRE
  REGENERATION
  AVENTURIER
  TAUNT
  SOIGNE
  VOL_DE_VIE
  SILENCE
}
```

`Deck`s are nothing special...

```
model Deck {
  id        Int        @id @default(autoincrement())
  name      String
  userId    Int
  user      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  cards     DeckCard[]
  createdAt DateTime   @default(now())

  @@index([userId])
}

model DeckCard {
  deckId Int
  cardId String
  qty    Int    @default(1)

  deck Deck @relation(fields: [deckId], references: [id], onDelete: Cascade)
  card Card @relation(fields: [cardId], references: [id], onDelete: Restrict)

  @@id([deckId, cardId])
  @@index([cardId])
}
```

## Features List

### Containerised solution - Core Module
The containers are the foundation on which we build the rest of the features. We know that we want two different builds, one for development and one for production. That's why we use three docker-compose files. `docker-compose.yml` and `docker-compose.override.yml` get merged to build the development environment. For production, it is `docker-compose.yml` and `docker-compose.prod.yml` that merge.
As said before, our Docker infrastructure has six services. The first one is the **nginx proxy**. It has a different config file for development and production. These config files are in the `proxy` directory. In development, the proxy is the stock `nginx` image with `proxy/dev.conf` mounted as its config. In production, it is built from `proxy/Dockerfile`, which uses `prod.conf.template` so we can insert an environment variable's value (`DOMAIN_NAME`). The main difference between the two is that in development, the proxy takes HTTP requests, but in production, it only takes HTTPS requests (port 80 only redirects to HTTPS). The certificate is self-signed and generated with `openssl` when the image is built, so it is baked into the container. The production config also adds security headers: `Strict-Transport-Security` (HSTS), `X-Frame-Options`, and `X-Content-Type-Options: nosniff`.
The proxy routes requests by path. Most requests go to the Next.js app. Since the game engine and `socket-server` both use Socket.IO, which listens on `/socket.io/` by default, we give `socket-server` its own path: `/socket.io/` goes to the game engine, and `/chat-socket.io/` goes to `socket-server`. This way, the browser only ever talks to the proxy's origin.
In development, the containers restart often (hot reload, crashes, rebuilds) and get a new IP each time. By default, nginx resolves a service's name only once, at startup, and would keep sending requests to the old IP, which gave us 502 errors until we restarted the proxy. `dev.conf` uses Docker's internal DNS (`resolver 127.0.0.11 valid=10s`) and puts the upstream name in a variable, so nginx looks up the IP again every 10 seconds.
The services are split across two Docker networks: `frontend` and `backend`. The proxy is only on `frontend`, while the database and Redis are only on `backend`, so the proxy can't reach them directly. The app, `socket-server`, and the game engine are on both.
The next two services are Redis for our in-memory store and Postgres for our database. They're presented together because they don't require any config outside of the docker-compose files. The database is connected to the app with Prisma. Redis is used by the socketio service to track online users and to back its Socket.IO adapter, and by the app to publish chat messages into that adapter (see `app/lib/socketEmitter.ts`).
Then we have the socketio service, a standalone Socket.IO server separate from the game engine's own Socket.IO instance. It authenticates clients using the Next.js session JWT, uses Redis to track which users are online and broadcast that presence, and delivers chat messages to their recipients. It deliberately does not relay messages sent by clients: the app validates and stores each message first, then pushes it through Redis (see **User interactions and management**). Its code and Dockerfile live in the `socket-server` directory; dev vs prod is just a different build target in that same Dockerfile, with the dev override mounting the source as a volume for hot-reload via nodemon.
The last two services are the game engine and the app. The game engine is its own Node/TypeScript process that runs games between players and the AI, sharing the app's Prisma schema instead of duplicating it. Its code and Dockerfile are in the `game_engine` directory, though its build context is the repo root so it can copy `app/prisma`. The app is the Next.js service itself, handling pages, API routes, and authentication; its code and Dockerfile are in the `app` directory, again with development and production as separate build targets. In production, an extra short-lived `static_assets` container (also built from `app`) copies the compiled static files into shared volumes so the proxy can serve them directly instead of routing them through Next.js.

### Next.js with Prisma - Framework + ORM Modules
The second step is building the Next.js app and connecting it to the database with Prisma. To create the app, in the app directory we run

```bash
npx create-next-app@latest
```

We add a Dockerfile to make two different builds: one for development and one for production. The production build compiles the app with `output: "standalone"` (`app/next.config.ts`), which bundles only the files the server needs, and the container runs the result with `node server.js` as a non-root user.

With the Next.js app and its App Router, we can already make some basic web pages. We now need to add Prisma to connect to the database. When creating the app container, we make sure to pass it a `DATABASE_URL` environment variable. Then we download Prisma and Prisma Client, used to communicate with the database.

```bash
npm install -D prisma
npm install @prisma/client
npx prisma init
```

The last command creates a `prisma` directory in our app. In it there is the `schema.prisma` file where we write our models. When we make a new model or edit an existing one, we run `npx prisma migrate dev --name <name>` in the app container connected to the database to create a new migration file. These files are applied each time the container starts (see `app/package.json`) with `prisma migrate deploy`.

#### data seeding
We want to add our game cards, a sample of users, and sample decks to our database. This happens at the same time as when we apply the migration, in the `app/package.json` file used when the container starts, with `prisma db seed`. This command runs the file given in `prisma.config.ts`: `app/prisma/seed.ts`. It seeds the cards, then the users, then the decks, because decks need both cards and users to exist (`app/prisma/seeds/`).
The seeds use `upsert`, so they are safe to re-run every time the container starts. The cards seed also removes cards that were deleted from the JSON file.
In development, the start script runs the seed with `;` (`prisma db seed; npm run dev`), so a failed seed doesn't stop the dev server. In production it uses `&&`, so a failed seed stops the app from starting.

#### prisma client
The Prisma Client is how we communicate with the database. Prisma 7 connects through a driver adapter: we use `@prisma/adapter-pg`, which wraps a `pg` `Pool` (declared with `adapter = "@prisma/adapter-pg"` in `schema.prisma`). In development, because we use Hot Module Replacement, each refresh re-executes modules like the Prisma Client, and we would end up with too many clients and database connections. To avoid that, outside of production we store the `PrismaClient` on `globalThis` and reuse it if it already exists. See `app/lib/prisma.ts`; the Redis emitter in `app/lib/socketEmitter.ts` uses the same pattern.

### Log in and Register, components and server actions - Core and Custom Design Modules
To log in the app we use a JWT cookie. This cookie is made up of the user's id, username, token version stored in the database, and expiry date. All this is signed with HS256 by our JWT secret to make sure we are the ones who actually made the cookie. The expiry date is seven days. The cookie is `httpOnly` so JavaScript in the page can't read it, `sameSite: lax`, and `secure` in production so it is only sent over HTTPS.
To check whether a user is signed in, we use the `getSession` function from `app/lib/auth/cookieSession.ts`. It checks whether the user has a valid session cookie. If they do not, they need to create one by signing in or registering. `getSession` also compares the cookie's token version with the one in the database: when a user changes their password, their `tokenVersion` goes up, and every other session cookie they had stops being accepted. In this file, we also find functions related to the handling of the session cookie.
Passwords are never stored as-is: they are hashed with argon2id (`@node-rs/argon2`). Usernames and emails are stored in lowercase, so signing in is case-insensitive. When someone signs in with a username that doesn't exist, the server still checks the password against a dummy hash, so the response takes about as long as for a real user and doesn't reveal which usernames exist. The error message is also always the same: "Invalid username or password."
To log out, the `logoutUser` server action deletes the session cookie and sends the user back to the home page.
To sign in and register, there are two custom components the `SignInForm` and `RegisterForm`. In the front end, the input is checked by the browser with HTML attributes on each field (`required`, `minLength`, `maxLength`, `pattern`), built from the same constants the server uses (`app/lib/auth/requirements.ts`); `RegisterForm` also checks that both passwords match. The data is then sent via `FormData` to two server actions in `app/lib/auth/authActions.ts`, which check the input again and do the necessary work with the database.

### Server-side rendering
In the Next.js App Router, components are Server Components by default: they are rendered on the server and only the resulting HTML is sent to the client, keeping the JavaScript bundle small and giving a fast first paint that's fully indexable by search engines. If a component needs to be interactive — hold state, react to clicks, or use hooks like `useState` — we add `'use client';` at the top of the file to signal that. This doesn't turn SSR off: Next.js still renders the component on the server for the initial HTML, but it also ships that component's JavaScript to the browser so it can be *hydrated* and become interactive afterwards.
`SignInForm` and `RegisterForm` are good examples: they're marked `'use client';` because they hold local state (`error`, `pending`) and need to react to user input immediately, but they're still server-rendered on first load like any other page content.
Server Components can also fetch data on the server before any HTML is sent. For example, the profile page (`app/app/profile/page.tsx`) loads the user's information with `getUserInfo()` and redirects to the home page if they aren't signed in, and the chat page (`app/app/chat/[id]/page.tsx`) loads the message history. The root layout (`app/app/layout.tsx`) also reads the session on the server.
The friend lists are the exception: they are client components that fetch their data from the `/api/friends` routes after the page loads.

### Track connected users - Real-time features
To track connected users, there are two new services: `socket-server`, a dedicated Socket.IO server, and a Redis service.
`socket-server` authenticates each socket with the JWT session cookie. Once authenticated, it tracks each user's connected sockets in Redis: a `user_sockets:<userId>` set per user (they may have several tabs or devices open) and an `online_users_meta` hash of `{userId, username}` (in `socket-server/presence.js`). On every connect and disconnect it re-reads that data and broadcasts a `presence:update` event with the full list of online users to every connected client (`socket-server/handlers/connection.js`). Redis is also what backs `@socket.io/redis-adapter` (`socket-server/redis.js`), so that broadcast would still reach every client even if `socket-server` was scaled to several replicas later.
Known limitations:
- `socket-server` only checks the JWT's signature, not its `tokenVersion`, so a session that was invalidated by a password change can still connect until the cookie expires. `socket-server` also receives a `DATABASE_URL` it doesn't use yet.
- Redis keeps its data in a volume. If `socket-server` crashes without handling its disconnections, the users it was tracking stay marked as online in Redis.
For the app, we add a React context (`PresenceProvider` in `app/app/presence.tsx`) that the root layout wraps around the page only when the user is logged in (`app/app/layout.tsx`).
It opens a single Socket.IO connection per tab to `socket-server` on the `/chat-socket.io/` path and listens for `presence:update`, exposing the resulting set of online user ids through a `useActiveUserIds()` hook. On top of it, the `usePresenceStatus()` hook resolves the status shown for any user: ONLINE when their id is in the live set and OFFLINE otherwise. The hook would show `IN_GAME` if the database said so, since sockets don't carry game state, but nothing sets that status yet, so it isn't implemented. Every status dot uses this hook so they all agree: friend and request rows (`app/components/friends/Row.tsx`), the profile page (`app/components/profile/ProfileInformation.tsx`), and the chat window (`app/components/chat/ChatWindow.tsx`).
The same connection is shared with the chat through a `useChatSocket()` hook, instead of the chat opening its own, which would count the user as connected twice.

### User interactions and management
We need to make a profile page, with friends, and a basic chat system. For the user management part, we need to let users edit their info, upload an avatar, add friends and see their online status with a profile page.

The profile page fetches the user's information and displays it in read-only mode. The same profile component is used for our own profile (`/profile`) and for any other user's (`/profile/<username>`); visiting our own username redirects to `/profile`. For our own profile, it is possible to edit our information and upload an avatar (`app/lib/user-and-friends/updateUserProfile.ts`):
- Changing the email or the password requires entering the current password, so a stolen session cookie alone isn't enough to take over the account. Accounts created with 42 that have no password skip this check.
- Changing the password increases `tokenVersion`, which logs out every other session, and gives the current session a new cookie so it stays signed in.
- Avatars must be PNG, JPEG, WEBP, or GIF images of at most 512 KB. The type is checked from the file's first bytes rather than trusting what the browser says. The image is stored as a base64 data URI directly in `User.avatar`.
- Users without an avatar see a `?` placeholder. A proper default avatar image is still to be added.

There is also a friends page where we can see all the requests we've received, those we've sent, and a list of our friends. The server actions in `app/lib/user-and-friends/friends.ts` let users search for someone by their exact username, send a friend request, accept or decline one, cancel one they sent, and remove a friend.
With each friend, there is a basic chat saved to the database. Only friends can message each other, which is checked both when loading the history and when sending a message, and messages are limited to 2000 characters. The chat page loads the history on the server. There is no separate conversation model: a conversation is every `Message` between the two users, in either direction. The same socket that is used for the chat is used to track active users and display their status to their profile page.
Chat messages never go from one browser to another directly. The sender calls the `sendMessage` server action (`app/lib/user-and-friends/messages.ts`), which checks that both users are friends and that the message is valid, stores it in the database, and only then publishes it with `@socket.io/redis-emitter` (`app/lib/socketEmitter.ts`) to the `user:<id>` rooms of both users. `socket-server` receives it through its Redis adapter and delivers it to their open tabs. This way, a client can't push a message that skips the checks or was never saved.


## Modules
The first module is the mandatory part.

### Core module
The project must be a web app with a frontend, backend, and a database. The frontend must be clear and accessible across all devices. The use of a CSS framework or styling solution is mandatory. Git must be used with meaningful commit messages from all team members. The deployment must use a containerised solution. The website must be compatible with the latest version of Chrome and show no warnings or errors about Javascript code in the browser console. Lastly, the project must include accessible Privacy Policy and Terms of Service pages with relevant content.
Credentials must be stored in a local `.env` file that is ignored by Git and you must provide an `.env.example` file. All forms and user inputs must be properly validated in both the frontend and the backend. Any connection to the backend must use HTTPS: this applies to our production build, while the development build runs over plain HTTP (see **Instructions**).

The Privacy Policy and Terms of Service pages are in `app/app/privacy` and `app/app/terms`.

We must also have a basic management system. Users must be able to sign up and log in securely.

### Major: use a framework for both the frontend and backend *(all)*
We use Next.js for a full-stack app. It is important to document both the frontend and backend features.
	
### Major: implement real-time features using WebSockets or similar technology *(fkrakow, brcoppie, stdevis)*
real-time updates across clients, handle connection/disconnection gracefully, efficient message broadcasting

### Minor: use an ORM for the database *(all)*
To connect to the database, we use Prisma, in both the app and the game engine. The game engine shares the app's Prisma schema instead of keeping its own copy (see **Next.js with Prisma**).

### Minor: Server-Side Rendering (SSR) for improved performance and SEO *(fkrakow, stdevis)*
See **Server-side rendering** in the Features List.

### Minor: custom-made design system with reusable components *(fkrakow, stdevis)*

### Major: allow users to interact with other users *(fkrakow)*
a basic chat system, a profile system, a friend system, multiplayer

### Major: standard user management and authentication *(fkrakow, stdevis)*
users can update their profile information, can upload an avatar with a default one if none provided, can add other users as friends and see their online status, have a profile page displaying their information.

### Minor: implement remote authentication with OAuth 2.0 *(stdevis)*

### Major: implement a complete web-based game *(brcoppie, lecartuy, stdevis)*

### Major: introduce an AI Opponent for games *(lecartuy)*

16 points

#### Minor: implement advanced search functionality *(stdevis)*
filters, sorting, and pagination. We could add that when we look at cards or decks or idk

#### Minor: game statistics and match history *(stdevis)*
track user game statistics (wins, loses, ranking, level, etc), display match history, show achievements and progression, leaderboard integration

Part of this exists: wins are counted per opponent type (`winsVsAiEasy`, `winsVsAiMedium`, `winsVsAiHard`, `winsVsPlayer`), and card backs are unlocked as achievements (`app/lib/cardBacks.ts`).

19 points

#### Major: remote players *(brcoppie, lecartuy)*
The game engine matches two queued players into a game and flips a coin to decide who starts (`game_engine/srcs/socket/serverSocket.ts`). A player who disconnects also has 30 seconds to reconnect to their game (`RECONNECT_GRACE_MS` in `game_engine/srcs/socket/gameSession.ts`).

#### Minor: game customisation options *(stdevis)*
power-ups, attacks, or special abilities, different maps or themes, customisable game settings, default options must be available


## Individual Contributions
---
detailed breakdown of what each team member contributed, with specific features, modules, or components implemented by each person, and any challenges faced and how they were overcome

- brcoppie: The main person behind the design of the game_engine and the game's rendering on the app using phaser. Worked on the protocol that connects the engine and the clients with sockets.io.

- fkrakow: Implemented the whole docker system, the database and added the friend list features with a chat system.

- lecartuy: Worked on the game_engine in parallel to brcoppie by implementing the ai opponent for the game. Created the 3 differents diffulty settings for the ai and mode selection. The biggest challenge faced was to keep the ai implentation updated with the changes made to the game_engine as this could mess up with the ai behavior in game. This was prevented by communicating frequently with brcoppie when making changes that altered the game_engine and its rules.

- stdevis: He was the one tasked with making the frontend of our project. He made sure our app had a consistent theme all around, that everything was responsive and user friendly. Worked on the API routes of app.

