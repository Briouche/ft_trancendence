# `docker-compose.override.yml`

> Racine du dépôt · surcouche de développement (chargée automatiquement par `docker compose`).

## 1. Rôle

Mode développement : cibles `development` des Dockerfiles, **code monté** dans les conteneurs
(rechargement à chaud), nginx en HTTPS sur **8080**.

## 2. Dépendances

- Complète `docker-compose.yml` ; utilisé par `make` / `make dev`.

## 3. Explication bloc par bloc

- `proxy` : image construite (`target: development`), port `8080:8080`, `dev.conf` monté en
  lecture seule.
- `app`, `game_engine`, `socketio` : `./dossier:/app` monté ; `/app/node_modules` (et
  `/app/.next`) en **volumes anonymes** pour ne pas écraser les dépendances de l'image par celles
  de l'hôte.
- `db` : port publié **sur 127.0.0.1 seulement** (outils locaux comme `prisma studio`).
- Aucun autre port n'est publié : tout passe par le proxy HTTPS.

## 4. Flux concret

Modifier `app/app/page.tsx` sur l'hôte → Next.js recompile → la page se met à jour.

## 5. Points d'attention

- Le serveur de jeu (ts-node) ne se recharge pas seul : `docker compose restart game_engine`.

## 6. Questions probables en évaluation

- **Le backend est-il accessible en HTTP ?** Non : seuls le proxy (HTTPS) et la base (en local
  uniquement) sont publiés.
