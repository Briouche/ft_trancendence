# `app/lib/redis.ts`

> Service : **app** · TypeScript (serveur) · ~30 lignes · connexion Redis de l'application.

## 1. Rôle

Un client Redis partagé (lecture de la présence) et l'**émetteur socket.io** (pousser des
événements via le serveur de chat).

## 2. Dépendances

- **Importe** : `ioredis`, `@socket.io/redis-emitter`.
- **Utilisé par** : `lib/presence.ts`, `lib/realtime.ts`.

## 3. Explication bloc par bloc

`maxRetriesPerRequest: 1` : si Redis est indisponible, on échoue vite (la présence apparaît
« offline », la requête HTTP réussit quand même). Même astuce `globalThis` que `prisma.ts` pour ne
pas ouvrir une connexion par rechargement en dev.

## 4. Flux concret

`getPresence([1,2])` → `redis.hmget(...)`.

## 5. Points d'attention

- `REDIS_URL` vient de `docker-compose.yml`.

## 6. Questions probables en évaluation

- **À quoi sert Redis ?** Présence en ligne et bus d'événements temps réel entre les services.
