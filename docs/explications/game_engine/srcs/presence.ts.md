# `game_engine/srcs/presence.ts`

> Service : **game_engine** · TypeScript · ~50 lignes · statut « en partie ».

## 1. Rôle

Maintient dans Redis la liste des joueurs **en train de jouer** (SET `presence:ingame`) et
prévient en temps réel les clients qui affichent ces joueurs, via le serveur de chat.

## 2. Dépendances

- **Importe** : `ioredis`, `@socket.io/redis-emitter`.
- **Utilisé par** : `index.ts` (`resetInGamePresence`), `socket/gameSession.ts` (`setInGame`).
- **Même clés que** : `app/lib/presence.ts` (lecture) et `socket-server/index.js` (en ligne).

## 3. Explication bloc par bloc

```ts
const emitter = new Emitter(redis);
export async function setInGame(userIds: number[], inGame: boolean) {
    inGame ? await redis.sadd(INGAME_KEY, ...ids) : await redis.srem(INGAME_KEY, ...ids);
    const counts = await redis.hmget(ONLINE_KEY, ...ids);            // connexions de chat ouvertes
    userIds.forEach((userId, i) => {
        const presence = inGame ? "in_game" : Number(counts[i]) > 0 ? "online" : "offline";
        emitter.to(`presence:${userId}`).emit("presence", { userId, presence });
    });
}
```

L'**émetteur Redis** publie un message que l'adaptateur Redis du serveur de chat relaie aux
sockets de la room `presence:<id>` : le serveur de jeu n'a pas besoin d'une connexion vers le
serveur de chat.

## 4. Flux concret

Une partie démarre → `setInGame([alice, bob], true)` → les amis d'Alice qui regardent `/friends`
voient « In a match » immédiatement.

## 5. Points d'attention

- Toute erreur Redis est journalisée et ignorée : un statut faux ne doit jamais casser une partie.

## 6. Questions probables en évaluation

- **Comment les autres voient-ils que je suis en partie ?** Redis `presence:ingame` + événement
  `presence` envoyé aux seuls clients qui m'affichent.
