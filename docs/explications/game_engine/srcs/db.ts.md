# `game_engine/srcs/db.ts`

> Service : **game_engine** · TypeScript · ~15 lignes · le client Prisma du serveur de jeu.

## 1. Rôle

Crée **le** client Prisma du serveur de jeu, avec l'adaptateur `pg` (pool de connexions
PostgreSQL). Même schéma que l'application : `app/prisma/schema.prisma` est copié dans l'image au
build (`game_engine/Dockerfile`).

## 2. Dépendances

- **Importe** : `@prisma/client`, `pg` (`Pool`), `@prisma/adapter-pg`.
- **Utilisé par** : `cardImport/cardLoader.ts` (catalogue, decks), `auth/session.ts`
  (`tokenVersion`), `matchResults.ts` (résultats).

## 3. Explication bloc par bloc

```ts
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,   // échoue vite si la base ne répond pas
    max: 15,                          // connexions simultanées au plus
    idleTimeoutMillis: 60000,         // garde les connexions entre deux parties
});
export const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
```

## 4. Flux concret

`recordMatch` (fin de partie) ouvre une transaction sur ce client.

## 5. Points d'attention

- Un seul client pour tout le processus : ne pas en créer d'autre (chaque client a son pool).

## 6. Questions probables en évaluation

- **Le serveur de jeu accède-t-il à la base sans ORM ?** Non, uniquement par ce client Prisma.
