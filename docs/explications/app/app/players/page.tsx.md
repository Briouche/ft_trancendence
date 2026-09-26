# `app/app/players/page.tsx`

> Service : **app** · Server Component (page) · `/players`

## 1. Rôle

Recherche de joueurs et classement (connectés). `PlayerSearch` est dans un `Suspense` (il lit l'URL avec `useSearchParams`).

## 2. Dépendances

- **Importe** : `lib/session.ts`, `config/routes.ts`, `./PlayerSearch`.

## 3. Explication bloc par bloc

`getSession()` ; pas de session → redirection vers `/`.

## 4. Flux concret

Menu du compte → Players & leaderboard.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
