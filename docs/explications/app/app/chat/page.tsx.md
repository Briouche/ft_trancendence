# `app/app/chat/page.tsx`

> Service : **app** · Server Component (page) · `/chat`

## 1. Rôle

Liste des amis avec qui discuter (données chargées côté serveur).

## 2. Dépendances

- **Importe** : `lib/session.ts`, `lib/friends.ts`, `config/routes.ts`, `./ChatFriendList`.

## 3. Explication bloc par bloc

`getSession()` ; pas de session → redirection vers `/`. Puis `listFriends(userId)` passé au composant.

## 4. Flux concret

Menu du compte → Chat.

## 5. Points d'attention

- Seuls les amis peuvent discuter.

## 6. Questions probables en évaluation

- **Avec qui peut-on discuter ?** Ses amis acceptés.
