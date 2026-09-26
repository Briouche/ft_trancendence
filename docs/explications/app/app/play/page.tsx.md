# `app/app/play/page.tsx`

> Service : **app** · Server Component (page) · `/play`

## 1. Rôle

Charge les decks et l'Elo du joueur, rend `PlayModeSelector`.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/session.ts`, `config/routes.ts`, `./PlayModeSelector`.

## 3. Explication bloc par bloc

`getSession()` ; pas de session → redirection vers `/`.

## 4. Flux concret

Hub → porte « Game room ».

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
