# `app/app/manual/page.tsx`

> Service : **app** · Server Component (page) · `/manual`

## 1. Rôle

Tutoriel (connectés) ; rend `ManualBook`.

## 2. Dépendances

- **Importe** : `lib/session.ts`, `config/routes.ts`, `./ManualBook`.

## 3. Explication bloc par bloc

`getSession()` ; pas de session → redirection vers `/`.

## 4. Flux concret

Hub → tableau « Tuto ».

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- **Où sont les règles du jeu ?** Ici (et dans le code : `game_engine/srcs/gameEngine.ts`).
