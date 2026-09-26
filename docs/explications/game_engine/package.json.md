# `game_engine/package.json`

> Service : **game_engine** · manifeste npm.

## 1. Rôle

Scripts et dépendances du serveur de jeu.

## 2. Dépendances déclarées

- Exécution : `socket.io`, `@prisma/client` + `@prisma/adapter-pg` + `pg` (base), `jose` (JWT),
  `ioredis` + `@socket.io/redis-emitter` (présence), `dotenv`.
- Développement : `typescript`, `ts-node`, `prisma` (CLI), `vitest`, `eslint`…
- `overrides` : force des versions corrigées de `mysql2` et `deepmerge-ts` (dépendances du CLI
  Prisma signalées par `npm audit`).

## 3. Scripts

`dev` (ts-node), `build` (tsc), `start` (node dist), `test` (vitest), `typecheck`, `lint`.

## 4. Flux concret

`npm test` → 23 tests (règles, IA, Elo, validation).

## 5. Points d'attention

- `npm audit` doit rester à 0 vulnérabilité.

## 6. Questions probables en évaluation

- **Comment lancer les tests ?** `cd game_engine && npm test`.
