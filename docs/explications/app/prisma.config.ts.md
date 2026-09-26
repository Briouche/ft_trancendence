# `app/prisma.config.ts`

> Service : **app** · configuration Prisma · CLI Prisma

## 1. Rôle

Indique au CLI Prisma le schéma, le dossier des migrations, la commande de seed (`npx tsx prisma/seed.ts`) et l'URL de la base (`DATABASE_URL`).

## 2. Dépendances

- `prisma/config`, `dotenv`.

## 3. Explication bloc par bloc

Un objet `defineConfig`.

## 4. Flux concret

`prisma migrate deploy` au démarrage du conteneur.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
