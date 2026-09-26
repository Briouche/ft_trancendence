# `app/lib/presence.ts`

> Service : **app** · TypeScript (serveur) · ~50 lignes · lire qui est en ligne.

## 1. Rôle

Lit la présence dans Redis : `online` (au moins un onglet connecté au serveur de chat),
`in_game` (assis à une partie), sinon `offline`.

## 2. Dépendances

- **Importe** : `lib/redis.ts`, `lib/presenceTypes.ts`.
- **Utilisé par** : `lib/users.ts`, `lib/userSearch.ts` (filtre « en ligne »).
- **Écrit par** : `socket-server/index.js` (HASH `presence:online`) et
  `game_engine/srcs/presence.ts` (SET `presence:ingame`).

## 3. Explication bloc par bloc

- `getPresence(ids)` : deux commandes Redis pour toute la liste (`HMGET` + `SMISMEMBER`) ; en
  cas de panne, tout le monde est « offline » (jamais d'exception).
- `getOnlineUserIds()` : tous les ids en ligne ou en partie (filtre de la recherche).

## 4. Flux concret

Page `/players` : 10 joueurs → une seule lecture Redis pour leurs 10 statuts.

## 5. Points d'attention

- La présence n'est **pas** en base : elle change sans cesse et n'a pas de sens après un
  redémarrage.

## 6. Questions probables en évaluation

- **Comment affiches-tu le statut en ligne ?** Lecture Redis ici au chargement, puis mises à jour
  en direct par le socket (`usePresence`).
