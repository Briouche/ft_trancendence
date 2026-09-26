# `app/app/api/friends/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · liste d'amis

## 1. Rôle

`GET /api/friends` : amis acceptés de l'utilisateur, avec avatar, Elo et présence.

## 2. Dépendances

- **Importe** : `lib/api.ts`, `lib/friends.ts`.
- **Appelé par** : `app/friends/FriendsPanel.tsx`.

## 3. Explication bloc par bloc

`requireSession` → `listFriends(userId)`.

## 4. Flux concret

Ouverture de `/friends`, et après chaque événement `friends:changed`.

## 5. Points d'attention

- Aucune donnée sensible (voir `lib/users.ts`).

## 6. Questions probables en évaluation

- **Comment la liste reste-t-elle à jour ?** Rechargée à chaque événement temps réel.
