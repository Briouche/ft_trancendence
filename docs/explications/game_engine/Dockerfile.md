# `game_engine/Dockerfile`

> Service : **game_engine** · Dockerfile.

## 1. Rôle

Image du serveur de jeu. Le contexte de build est la **racine du dépôt** car le schéma Prisma est
partagé avec l'application (`app/prisma`).

## 2. Dépendances

- `docker-compose.yml` (`context: .`, `dockerfile: game_engine/Dockerfile`).

## 3. Explication bloc par bloc

- `deps` : `npm ci` + copie de `app/prisma` + `prisma generate` (client Prisma avec le même
  schéma que l'app).
- `development` : ts-node, code monté par l'override.
- `builder` : `tsc` → `dist/`.
- `prod-deps` : dépendances de production seulement + client Prisma généré.
- `production` : utilisateur non root `gameengine`, `node dist/index.js`.

## 4. Flux concret

Modifier le schéma Prisma → rebuild de `game_engine` nécessaire (le client est généré au build).

## 5. Points d'attention

- Le `.dockerignore` racine évite d'envoyer tout le dépôt au démon Docker.

## 6. Questions probables en évaluation

- **Comment le serveur de jeu partage-t-il le schéma ?** Il est copié depuis `app/prisma` au
  build.
