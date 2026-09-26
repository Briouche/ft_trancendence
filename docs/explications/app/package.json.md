# `app/package.json`

> Service : **app** · manifeste npm · dépendances et scripts

## 1. Rôle

Scripts (`dev`, `build`, `start`, `lint`, `test`, `typecheck`, `start:dev`/`start:prod` avec migrations + seed) et dépendances.

## 2. Dépendances

- Principales : `next`, `react`, `@prisma/client` + `@prisma/adapter-pg` + `pg`, `@node-rs/argon2`, `jose`, `zod`, `socket.io-client`, `ioredis` + `@socket.io/redis-emitter`, `phaser`, `three` (épinglé en 0.182) + `@react-three/*`, `tsx` (exécuter le seed).
- Dev : `typescript`, `eslint`, `tailwindcss`, `prisma` (CLI), `vitest`.
- `overrides` : versions corrigées de `mysql2` et `deepmerge-ts` (dépendances du CLI Prisma signalées par `npm audit`).

## 3. Explication bloc par bloc

`postinstall: prisma generate` : le client Prisma est régénéré à chaque installation.

## 4. Flux concret

`npm test` → 37 tests.

## 5. Points d'attention

- three.js reste en 0.182 : au-delà, `@react-three/fiber` provoque un avertissement console (décision D15).

## 6. Questions probables en évaluation

- **Combien de vulnérabilités ?** `npm audit` : 0.
