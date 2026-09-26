# `docker-compose.prod.yml`

> Racine du dépôt · surcouche de production (`make prod`).

## 1. Rôle

Images de production, nginx sur **80/443**, fichiers statiques de Next.js servis par nginx,
redémarrage automatique.

## 2. Dépendances

- `make prod` : `docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build`.

## 3. Explication bloc par bloc

- `proxy` : cible `production`, argument `DOMAIN_NAME` (certificat), ports 80/443, volumes des
  statiques en lecture seule, attend `static_assets`.
- `static_assets` : conteneur éphémère qui copie `.next/static` et `public/` de l'image de l'app
  dans les volumes lus par nginx, puis s'arrête.
- `restart: always` partout.

## 4. Flux concret

`make prod` → build de production de Next (`next build`, sortie *standalone*) → nginx sert
`https://<DOMAIN_NAME>`.

## 5. Points d'attention

- Les avatars restent servis par l'app (`/api/avatars/...`), pas depuis `public/`.

## 6. Questions probables en évaluation

- **Comment serais-tu déployé ?** `make prod` sur une machine avec le domaine configuré.
