# `app/Dockerfile`

> Service : **app** · Dockerfile · image de l'application

## 1. Rôle

Construit l'image Next.js en plusieurs étapes : `deps` (`npm ci` + client Prisma), `development` (code monté, `npm run start:dev`), `builder` (`next build`), `production` (sortie *standalone*, utilisateur non root `nextjs`, `npm run start:prod`).

## 2. Dépendances

- Utilisé par `docker-compose.yml` (service `app`), cible choisie par l'override (dev) ou `docker-compose.prod.yml`.

## 3. Explication bloc par bloc

- `start:dev` et `start:prod` lancent `prisma migrate deploy` puis le seed avant le serveur : la base est toujours à jour au démarrage.
- Production : crée `/data/avatars` appartenant à `nextjs` (point de montage du volume des avatars ; Docker initialise un volume vide avec les droits du dossier de l'image).

## 4. Flux concret

`make` → cible `development` → `next dev` (rechargement à chaud).

## 5. Points d'attention

- `NEXT_TELEMETRY_DISABLED=1` en build et en prod.

## 6. Questions probables en évaluation

- **Comment les migrations sont-elles appliquées ?** Au démarrage du conteneur, avant le serveur.
