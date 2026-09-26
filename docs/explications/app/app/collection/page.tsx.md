# `app/app/collection/page.tsx`

> Service : **app** · Server Component (page) · `/collection`

## 1. Rôle

Charge la collection du joueur (cartes possédées, dos équipé et débloqués, total du catalogue) et rend `CollectionBook`.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/session.ts`, `config/routes.ts`, `./CollectionBook`.

## 3. Explication bloc par bloc

`getSession()` ; pas de session → redirection vers `/`. Trois requêtes en parallèle (`Promise.all`).

## 4. Flux concret

Hub → fauteuil « Collection ».

## 5. Points d'attention

- `dynamic` implicite (dépend des cookies).

## 6. Questions probables en évaluation

- Aucune spécifique.
