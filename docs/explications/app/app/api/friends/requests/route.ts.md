# `app/app/api/friends/requests/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · demandes d'ami

## 1. Rôle

`GET` : demandes reçues (`incoming`) et envoyées (`outgoing`). `POST { username }` : envoie une demande (ou accepte la demande inverse).

## 2. Dépendances

- **Importe** : `zod`, `lib/api.ts`, `lib/friends.ts`, `lib/validation.ts`, `lib/rateLimit.ts`.

## 3. Explication bloc par bloc

- POST : corps validé (nom d'utilisateur) → 30 demandes / heure max → `sendFriendRequest`.
- Les issues **attendues** (joueur inconnu, déjà amis, demande déjà envoyée, soi-même) répondent **200** avec `{ ok: false, error }` : un 4xx s'afficherait en erreur rouge dans la console du navigateur à chaque faute de frappe (le sujet exige une console propre). Les vraies erreurs gardent leur code (400, 401, 429).

## 4. Flux concret

Taper « bob » dans « Add a friend » → POST → `{ ok: true, result: "sent" }` → toast.

## 5. Points d'attention

- Voir la décision D14 dans `docs/DECISIONS.md`.

## 6. Questions probables en évaluation

- **Pourquoi 200 pour « joueur introuvable » ?** Réponse métier normale, pas une erreur technique ; console propre.
