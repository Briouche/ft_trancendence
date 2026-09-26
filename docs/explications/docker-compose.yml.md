# `docker-compose.yml`

> Racine du dépôt · définition des services (commune dev/prod).

## 1. Rôle

Décrit les six services, leurs variables d'environnement, dépendances, réseaux et volumes.
`docker-compose.override.yml` (dev, chargé automatiquement) ou `docker-compose.prod.yml`
complètent ce fichier.

## 2. Dépendances

- Variables lues dans `.env` (`POSTGRES_*`, `JWT_SECRET`, `FT_*`, `DOMAIN_NAME`).
- Construit `app/`, `socket-server/`, `game_engine/` (contexte = racine, pour copier le schéma
  Prisma de `app/`), `proxy/`.

## 3. Explication bloc par bloc

- **Réseaux** : `frontend` (proxy ↔ services) et `backend` (services ↔ base/Redis) ; la base et
  Redis ne sont pas sur le réseau du proxy.
- **app** : `DATABASE_URL`, `JWT_SECRET`, identifiants 42, `REDIS_URL`, `AVATAR_DIR` + volume
  `avatars`; attend que la base et Redis soient *healthy* ; `restart: unless-stopped`.
- **socketio** : `REDIS_URL`, `APP_INTERNAL_URL` (authentification via l'app) ; pas de secret.
- **game_engine** : `DATABASE_URL`, `JWT_SECRET` (vérifie le cookie), `REDIS_URL`.
- **redis** et **db** : images officielles avec *healthcheck* ; volumes `redis_data`, `db_data`.
- **Volumes** : `db_data`, `redis_data`, `avatars` (persistants entre redémarrages).

## 4. Flux concret

`make` → db et redis démarrent → healthchecks OK → app (migrations + seed), game_engine, socketio
→ proxy.

## 5. Points d'attention

- Les secrets viennent **uniquement** de `.env` (jamais écrits dans ce fichier).

## 6. Questions probables en évaluation

- **Pourquoi deux réseaux ?** Isoler la base et Redis : seul le code applicatif peut les joindre.
