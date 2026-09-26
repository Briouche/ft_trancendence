# `app/app/api/users/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · recherche de joueurs

## 1. Rôle

`GET /api/users?q=&sort=&order=&filter=&page=&pageSize=` : une page de joueurs (recherche avancée / classement).

## 2. Dépendances

- **Importe** : `lib/api.ts`, `lib/userSearch.ts`, `lib/validation.ts`.
- **Appelé par** : `app/players/PlayerSearch.tsx`.

## 3. Explication bloc par bloc

Paramètres passés par `userSearchSchema` (valeurs invalides → défauts) → `searchUsers`.

## 4. Flux concret

Voir `lib/userSearch.ts`.

## 5. Points d'attention

- Réservé aux utilisateurs connectés.

## 6. Questions probables en évaluation

- **Où se fait la pagination ?** Dans la base (`skip`/`take`).
