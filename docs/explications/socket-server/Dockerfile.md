# `socket-server/Dockerfile`

> Service : **socketio** · Dockerfile · image du serveur de chat.

## 1. Rôle

Deux cibles : `development` (toutes les dépendances, `nodemon` qui redémarre à chaque
modification, code monté par `docker-compose.override.yml`) et `production` (`npm ci --omit=dev`,
utilisateur non root `node`, `node index.js`).

## 2. Dépendances

- Utilisé par `docker-compose.yml` (service `socketio`), cible choisie par
  `docker-compose.override.yml` (dev) ou `docker-compose.prod.yml`.

## 3. Explication bloc par bloc

`FROM node:20-alpine AS base` → copie `package*.json` → chaque cible installe ses dépendances
puis copie le code. `EXPOSE 4000` (port interne, non publié sur l'hôte).

## 4. Flux concret

`make` construit la cible `development` et lance `npm run dev`.

## 5. Points d'attention

- En production, le processus ne tourne pas en root (`USER node`).

## 6. Questions probables en évaluation

- **Pourquoi deux cibles ?** Rechargement à chaud en dev, image minimale et sans outils de dev en
  prod.
