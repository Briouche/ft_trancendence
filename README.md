Things to do in the README:

multiple sections
- add links to sections in current place holders "Features and Modules"

resources
- add resources

project management
- continue on how we defined the game in Project management section

technical stack
- explain how we did the graphics for the app
- how the game engine renders things
- how the monte carlo simulation tree works

database schema
- explain in brief details the Card and Deck models



*This project has been created as part of the 42 curriculum by brcoppie, fkrakow, lecartuy, stdevis*

## Description
ft_transcendence is a real-world web application built as a team project. We chose to make a [digital collectible card game](https://en.wikipedia.org/wiki/Digital_collectible_card_game).

To play, players must log in or register. Each player has their own card collection and uses it to build decks. With their decks, they can play against other players or an AI opponent of varying difficulty.

The game also includes *social* features: adding friends, user profiles, chats, and signing in with a 42 account.

The app is fully containerised and made up of six services:

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
First, set up the environment variables: copy `.env.example` to `.env` and fill in your own values.
Build the project with `make` (equivalent to `make dev`) for development, or `make prod` for production. We use separate environments because dev and prod builds have different requirements.

In **development** we expose every service on its own port. The proxy accepts plain HTTP and supports Hot Module Replacement (HMR) for the Next.js app, which runs uncompiled. The source code is mounted as local volumes rather than baked into the containers, so changes are picked up immediately.

In **production** we expose only the proxy, and only over HTTPS. The app and game engine are compiled and embedded directly into their containers instead of relying on mounted volumes. The proxy configuration is also more elaborate, serving static assets directly instead of routing them through the Node server.

---
any relevant information about compilation, installation, and/or execution
mention all the needed prerequisites (software, tools, versions, configuration like .env setup, etc.), and step-by-step instructions to run the project


## Resources
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

---
how the team organised the work, which tools and channels were used for the project management

## Technical Stack
The website is built on Next.js, using Prisma as the ORM and Socket.IO for WebSocket communication. A Redis service tracks online users for the real-time presence feature **(we could also use it to cache game-engine state, but that isn't implemented yet)**. Our database is PostgreSQL.

For styling we use React components with Tailwind CSS, and ... for the 3D graphics ...

The game engine and the AI opponent are both written in TypeScript. The game engine renders its graphics with ...

For the AI opponent, we use a Monte Carlo Simulation tree ...

---
frontend and backend technologies and frameworks used. The database system chosen and why. Any other significant technologies or libraries and justification for major technical choices


## Database Schema
The main models are `User`, `Card`, and `Deck`.

A `User` is identified by its id, and has an email and username, paired with either a password or a `fortyTwoId` for 42-account sign-in. Additional fields include an avatar, status, creation date, a set of decks, a set of cards, a count of unopened packs, a pity counter, and assorted statistics. Users can also send and receive friend requests, modelled as their own relation.

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

---
visual representation or description of the database structure with tables and their relationships with key fields and datatypes


## Features List

### Containerised solution - Core Module
The containers are the foundation on which we build the rest of the features. We know that we want two different builds, one for development and one for production. That's why we use three docker-compose files. `docker-compose.yml` and `docker-compose.override.yml` get merged to build the development environment. For production, it is `docker-compose.yml` and `docker-compose.prod.yml` that merge.
As said before, our Docker infrastructure has six services. The first one is the **nginx proxy**. It has a different config file for development and production. These config files are in the `proxy` directory. We use a `.conf.template` for production so we can insert an environment variable's value. The main difference between the two is that in development, the proxy takes HTTP requests, but in production, it only takes HTTPS requests — the SSL keys are baked into the container.
The next two services are Redis, our in-memory store, and Postgres, our database. We present them together because they don't require any config outside of the docker-compose files. The database is connected to the app with Prisma. Redis is currently only used by the socketio service — the app receives a `REDIS_URL` too, but doesn't use it yet.
We then have the socketio service, a standalone Socket.IO server separate from the game engine's own Socket.IO instance. It authenticates clients using the Next.js session JWT, uses Redis to track which users are online and broadcast that presence, and relays chat messages between clients. Its code and Dockerfile live in the `socket-server` directory; dev vs prod is just a different build target in that same Dockerfile, with the dev override mounting the source as a volume for hot-reload via nodemon.
And the last two services are the game engine and the app. The game engine is its own Node/TypeScript process that runs games between players and the AI, sharing the app's Prisma schema instead of duplicating it. Its code and Dockerfile are in the `game_engine` directory, though its build context is the repo root so it can copy `app/prisma`. The app is the Next.js service itself, handling pages, API routes, and authentication; its code and Dockerfile are in the `app` directory, again with development and production as separate build targets. In production, an extra short-lived `static_assets` container (also built from `app`) copies the compiled static files into shared volumes so the proxy can serve them directly instead of routing them through Next.js.

### Next.js with Prisma - Framework + ORM Modules
The second step is building the Next.js app and connecting it to the database with Prisma. To create the app, in the app directory we run

```bash
npx create-next-app@latest
```

We add a Dockerfile to make two different builds: one for development and one for production; the production build compiles the files for better performance.

With the Next.js app and its App Router, we can already make some basic web pages. We now need to add Prisma to connect to the database. When creating the app container, we make sure to pass it a `DATABASE_URL` environment variable. Then we download Prisma and Prisma Client, used to communicate with the database.

```bash
npm install -D prisma
npm install @prisma/client
npx prisma init
```

The last command creates a `prisma` directory in our app. In it there is the `schema.prisma` file where we write our models. When we make a new model or edit an existing one, we run `npx prisma migrate dev --name <name>` in the app container connected to the database to create a new migration file. These files are applied each time the container starts (see `app/package.json`) with `prisma migrate deploy`.

#### data seeding
We want to add a sample of users and our game cards to our database. This happens at the same time as when we apply the migration, in the `app/package.json` file used when the container starts, with `prisma db seed`. This command runs the file given in `prisma.config.ts`.

#### prisma client
The Prisma Client is how we communicate with the database. We use `pg`'s pool rather than Prisma's own bundled query engine for Prisma 7. In development, because we use Hot Module Replacement, we need a check for an existing pool. If we were to do nothing, each time it refreshes, it re-executes modules like the Prisma Client and we would end up with too many clients. See `app/lib/prisma.ts`.

### Log in and Register, components and server actions - Core and Custom Design Modules
To log in the app we use a JWT cookie. This cookie is made up of the user's id, username, and token version stored in the database. All this is signed by our JWT secret to make sure we are the ones who actually made the cookie. We also add an expiry date of seven days. 
To check whether a user is signed in, we use the `getSession` function from `app/lib/auth/cookieSession.ts`. It checks whether the user has a valid session cookie. If they do not, they need to create one by signing in or registering. In this file, we also find functions related to the handling of the session cookie.
To sign in and register, there are two custom components the `SignInForm` and `RegisterForm`. Both take the user input, make some checks in the front end, then send the data via `FormData`. We then have two server actions in `app/lib/auth/formActions.ts` that check the input again and do the necessary work with the database.

### Server-side rendering
By default, React renders components on the server and ships only the resulting HTML to the client, keeping the JavaScript bundle small and giving a fast first paint that's fully indexable by search engines. If a component needs to be interactive — hold state, react to clicks, or use hooks like `useState` — we add `'use client';` at the top of the file to signal that. This doesn't turn SSR off: Next.js still renders the component on the server for the initial HTML, but it also ships that component's JavaScript to the browser so it can be *hydrated* and become interactive afterwards.
`SignInForm` and `RegisterForm` are good examples: they're marked `'use client';` because they hold local state (`error`, `pending`) and need to react to user input immediately, but they're still server-rendered on first load like any other page content.

### Track connected users - Real-time features
To track connected users, there are two new services: `socket-server`, a dedicated Sockeet.io server and a redis service.
`socket-server` authenticates each socket with the JWT session cookie. Once authenticated, it tracks each user's connected sockets in Redis: a `user_sockets:<userId>` set per user (they may have several tabs or devices open) and an `online_users_meta` hash of `{userId, username}` (in `socket-server/presence.js`). On every connect and disconnect it re-reads that data and broadcasts a `presence:update` event with the full list of online users to every connected client (`socket-server/handlers/connection.js`). Redis is also what backs `@socket.io/redis-adapter` (`socket-server/redis.js`), so that broadcast would still reach every client even if `socket-server` was scaled to several replicas later.
For the app, we add a React context near root layout for each session (`PresenceProvider` in `app/app/presence.tsx`). 
It opens a single Socket.IO connection to `socket-server` on the `/chat-socket.io/` path and listens for `presence:update`, exposing the resulting set of online user ids through a `useActiveUserIds()` hook. `FriendsList` (`app/app/friends/FriendsList.tsx`) is the first consumer: for each friend it reads from the database, it overrides the status dot to ONLINE when that friend's id is in the live set, and to OFFLINE otherwise — except `IN_GAME`, which still comes straight from the database since sockets don't carry game state (yet).

### User interactions
...

### Standard user management
...

---
complete list of implemented features, which team member(s) worked on each feature and a brief description of each feature's functionality


## Modules
The first module is the mandatory part.

### Core module
The project must be a web app with a frontend, backend, and a database. The frontend must be clear and accessible across all devices. The use of a CSS framework or styling solution is mandatory. Git must be used with meaningful commit messages from all team members. The deployment must use a containerised solution. The website must be compatible with the latest version of Chrome and show no warnings or errors about Javascript code in the browser console. Lastly, the project must include accessible Privacy Policy and Terms of Service pages with relevant content.
Credentials must be stored in a local `.env` file that is ignored by Git and you must provide an `.env.example` file. All forms and user inputs must be properly validated in both the frontend and the backend. Any connection to the backend must use HTTPS.

We must also have a basic management system. Users must be able to sign up and log in securely.

### Major: use a framework for both the frontend and backend
We use Next.js for a full-stack app. It is important to document both the frontend and backend features.
	
### Major: implement real-time features using WebSockets or similar technology
real-time updates across clients, handle connection/disconnection gracefully, efficient message broadcasting

### Minor: use an ORM for the database
To connect to the database in the app, we use Prisma.

### Minor: server-Side Rendering (SSR) for improved performance and SEO
Not documented yet.

### Minor: custom-made design system with reusable components
including a proper colour palette, typography, and icons (minimum 10 reusable components)


### Major: allow users to interact with other users
a basic chat system, a profile system, a friend system

### Major: standard user management and authentication
users can update their profile information, can upload an avatar with a default one if none provided, can add other users as friends and see their online status, have a profile page displaying their information.

### Minor: implement remote authentication with OAuth 2.0

### Major: implement a complete web-based game

### Major: introduce an AI Opponent for games


16 points

on peut éventuellement ajouter l'un de ces modules

#### Minor: implement a complete 2FA system for the users

#### Minor: implement advanced search functionality
filters, sorting, and pagination. We could add that when we look at cards or decks or idk

#### Minor: game statistics and match history
track user game statistics (wins, loses, ranking, level, etc), display match history, show achievements and progression, leaderboard integration
Il faut quand même ajouter quelques trucs mais c'est toujours faisable

19 points

#### Major: remote players
enable two players on separate computers to play the same game in real-time. Handle network latency and disconnection gracefully, provide a smooth user experience for remote gameplay, implement a reconnection logic.
Il faudra beaucoup ajouter dans les redis.

#### Minor: advanced chat features
ability to block users from messaging you, invite users to play games directly from chat, game/tournament notifications in chat, access to user profiles from chat interface, chat history persistence, typing indicators and read receipts

#### Minor: game customisation options
power-ups, attacks, or special abilities, different maps or themes, customisable game settings, default options must be available

#### Minor: implement spectator mode for games
allow users to watch ongoing games, real-time updates for spectators, optional: spectator chat


---
list of all chosen modules with point calculation and justification for each module choice, how it was implemented, and which team member(s) worked on each module


## Individual Contributions
---
detailed breakdown of what each team member contributed, with specific features, modules, or components implemented by each person, and any challenges faced and how they were overcome

