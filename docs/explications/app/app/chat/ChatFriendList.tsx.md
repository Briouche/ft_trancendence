# `app/app/chat/ChatFriendList.tsx`

> Service : **app** · Client Component · liste des conversations

## 1. Rôle

Affiche les amis, **en ligne d'abord**, avec présence en direct et un bouton « Open ».

## 2. Dépendances

- **Importe** : `PageShell`, `Panel`, `EmptyState`, `TextLink`, `usePresence`, `config/routes.ts`, `../friends/UserRow`.

## 3. Explication bloc par bloc

`usePresence(ids, initial)` : présence initiale reçue du serveur, puis mises à jour du socket ; tri par (en ligne ? 1 : 0).

## 4. Flux concret

Un ami se connecte → il remonte en tête de liste et passe au vert.

## 5. Points d'attention

- Aucun ami → lien vers `/friends`.

## 6. Questions probables en évaluation

- **Comment vois-tu qui est en ligne ?** Pastille + texte, mis à jour en temps réel.
