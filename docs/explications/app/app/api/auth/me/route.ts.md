# `app/app/api/auth/me/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · qui est connecté ?

## 1. Rôle

`GET /api/auth/me` : `{ id, username }` du propriétaire du cookie de session, ou 401. Utilisé par le **serveur de chat** pour authentifier ses connexions (il transmet le cookie du handshake).

## 2. Dépendances

- **Importe** : `lib/api.ts`, `lib/session.ts`.
- **Appelé par** : `socket-server/index.js`.

## 3. Explication bloc par bloc

`getSession()` (signature, expiration, `tokenVersion`) → JSON ou 401.

## 4. Flux concret

Ouverture du socket de chat → `fetch http://app:3000/api/auth/me` avec le cookie → 200 → connexion acceptée.

## 5. Points d'attention

- Ne renvoie que l'id et le nom (rien de sensible).

## 6. Questions probables en évaluation

- **Comment le serveur de chat vérifie-t-il les sessions sans la base ?** Il demande à cette route.
