# `socket-server/package.json`

> Service : **socketio** · manifeste npm.

## 1. Rôle

Déclare le module (`"type": "module"` → syntaxe `import`), les scripts et les dépendances.

## 2. Dépendances déclarées

- `socket.io` : serveur WebSocket ;
- `@socket.io/redis-adapter` : partage des rooms via Redis ;
- `ioredis` : client Redis ;
- développement : `nodemon` (redémarrage auto), `eslint`, `@eslint/js`, `globals`.

## 3. Scripts

`start` (`node index.js`), `dev` (`nodemon index.js`), `lint` (`eslint .`).

## 4. Flux concret

Le Dockerfile de dev lance `npm run dev`.

## 5. Points d'attention

- Pas de dépendance JWT ni base de données : l'authentification est déléguée à l'app.

## 6. Questions probables en évaluation

- **Pourquoi Redis ?** Présence partagée entre services et bus d'événements (adaptateur socket.io).
