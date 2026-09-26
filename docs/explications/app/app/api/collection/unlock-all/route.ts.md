# `app/app/api/collection/unlock-all/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · outil de test : tout débloquer

## 1. Rôle

`POST /api/collection/unlock-all` (**développement uniquement**) : donne toutes les cartes au maximum et tous les dos.

## 2. Dépendances

- **Importe** : `@prisma/client` (`Prisma.sql`), `lib/prisma.ts`, `lib/session.ts`, `lib/devTools.ts`, `lib/cardBacks.ts`.

## 3. Explication bloc par bloc

Un seul `INSERT … VALUES … ON CONFLICT DO UPDATE` pour toutes les cartes (au lieu d'une requête par carte), en SQL **taggé** (`Prisma.sql`, valeurs échappées).

## 4. Flux concret

Utile pour construire un deck rapidement en démonstration (dev).

## 5. Points d'attention

- 404 en production.

## 6. Questions probables en évaluation

- **Pourquoi du SQL brut ici ?** Upsert en masse, que Prisma ne sait pas faire en une requête ; paramètres échappés par Prisma.
