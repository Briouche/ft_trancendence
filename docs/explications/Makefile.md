# `Makefile`

> Racine du dépôt · commandes de lancement.

## 1. Rôle

La **commande unique** du sujet : `make` construit et lance toute l'application.

## 2. Dépendances

- Charge `.env` (`include .env`) ; pilote `docker compose` avec les fichiers `docker-compose*.yml`.

## 3. Explication bloc par bloc

| Cible | Action |
|---|---|
| `make` / `make dev` | `docker compose up --build --renew-anon-volumes` : mode dev (HTTPS sur 8080, rechargement à chaud) |
| `make prod` | idem avec `docker-compose.prod.yml` : images de production, HTTPS sur 443 |
| `make clean` | arrête et supprime les conteneurs |
| `make fclean` | + supprime les volumes (base, Redis, avatars) |
| `make ffclean` | + purge les images et volumes Docker inutilisés |
| `make re` | `fclean` puis `all` |

`--renew-anon-volumes` : `node_modules` vit dans un volume anonyme que Docker réutiliserait
sinon ; une dépendance ajoutée à `package.json` n'arriverait jamais dans le conteneur.

## 4. Flux concret

Premier lancement : `cp .env.example .env`, remplir, `make` → https://localhost:8080.

## 5. Points d'attention

- `make fclean` **efface la base de données** (comptes, parties).

## 6. Questions probables en évaluation

- **Comment lancer le projet ?** `make` (une seule commande).
