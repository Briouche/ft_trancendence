# `app/lib/realtime.ts`

> Service : **app** · TypeScript (serveur) · ~20 lignes · pousser un événement vers des navigateurs.

## 1. Rôle

`pushToUsers(userIds, event, payload)` envoie un événement à **toutes les connexions** des
utilisateurs donnés (rooms `user:<id>` du serveur de chat).

## 2. Dépendances

- **Importe** : `lib/redis.ts` (émetteur socket.io).
- **Utilisé par** : `lib/friends.ts`, `lib/messages.ts`.

## 3. Explication bloc par bloc

```ts
io.to(userIds.map((id) => `user:${id}`)).emit(event, payload);
```

`io` est un **émetteur Redis** : il publie le message dans Redis, et le serveur de chat (branché
sur Redis par son adaptateur) le livre. L'application n'ouvre jamais de socket elle-même. Les
erreurs sont journalisées sans faire échouer la requête (les données sont déjà enregistrées).

## 4. Flux concret

`sendMessage` → `pushToUsers([1, 2], "chat:message", msg)`.

## 5. Points d'attention

- Les noms d'événements sont centralisés dans `lib/chatEvents.ts`.

## 6. Questions probables en évaluation

- **Comment le serveur Next envoie-t-il un message en temps réel ?** Émetteur socket.io via Redis.
