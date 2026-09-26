# `app/lib/prisma.ts`

> Service : **app** · TypeScript · ~30 lignes · le client Prisma de l'application.

## 1. Rôle

Crée un **unique** client Prisma (avec l'adaptateur `pg` et un pool de 10 connexions).

## 2. Dépendances

- **Importe** : `@prisma/client`, `pg`, `@prisma/adapter-pg`.
- **Utilisé par** : tout le code serveur qui lit ou écrit la base.

## 3. Explication bloc par bloc

```ts
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
```

En développement, Next recharge les modules à chaque modification : sans cette astuce, chaque
rechargement ouvrirait un nouveau pool et saturerait PostgreSQL.

## 4. Flux concret

`import prisma from "@/lib/prisma"` puis `prisma.user.findUnique(...)`.

## 5. Points d'attention

- `idleTimeoutMillis: 60000` garde les connexions entre deux requêtes (évite de refaire la poignée
  de main TCP + authentification).

## 6. Questions probables en évaluation

- **Faites-vous du SQL à la main ?** Non, sauf deux upserts en masse via `$executeRaw` **taggé**
  (paramètres échappés par Prisma).
