# `game_engine/srcs/auth/session.ts`

> Service : **game_engine** · TypeScript · ~70 lignes · authentification du WebSocket de jeu.

## 1. Rôle

Retrouve l'utilisateur derrière une connexion socket à partir du **cookie de session** émis par
l'application (même secret `JWT_SECRET`). Refuse les cookies absents, invalides, expirés ou
**révoqués**.

## 2. Dépendances

- **Importe** : `jose` (`jwtVerify`), `db.ts` (lecture de `tokenVersion`).
- **Utilisé par** : `socket/serverSocket.ts` (middleware `io.use`).
- **Symétrique de** : `app/lib/session.ts` (qui crée le cookie).

## 3. Explication bloc par bloc

- `readSessionCookie(header)` : extrait la valeur du cookie `session` de l'en-tête `Cookie`.
- `authenticateCookieHeader(header)` :

```ts
const verified = await jwtVerify(token, readSecret(), { algorithms: ["HS256"] });  // signature + expiration
const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { tokenVersion: true, username: true } });
if (!user || user.tokenVersion !== payload.tokenVersion) return null;             // session révoquée
return { userId: payload.userId, username: user.username };
```

`algorithms: ["HS256"]` empêche l'attaque « alg: none » ou un changement d'algorithme.

## 4. Flux concret

Le navigateur ouvre `wss://…/socket.io/` : le cookie `session` part avec le handshake ; si
l'utilisateur a changé son mot de passe entre-temps (`tokenVersion` incrémenté), la connexion est
refusée → « Session expired — please sign in again. »

## 5. Points d'attention

- Le nom d'utilisateur est relu en base (il a pu changer depuis l'émission du JWT).

## 6. Questions probables en évaluation

- **Comment sécurises-tu le WebSocket ?** Cookie de session vérifié au handshake (signature,
  expiration, révocation) + vérification de l'origine (`serverSocket.ts`) + WSS via nginx.
