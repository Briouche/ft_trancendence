# `app/app/api/decks/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · créer un deck

## 1. Rôle

`POST /api/decks` : crée un deck pour l'utilisateur connecté après validation complète (forme, possession des cartes, limites).

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/session.ts`, `lib/decks.ts`.
- **Appelé par** : `app/deck/new/DeckBuilder.tsx`.

## 3. Explication bloc par bloc

Session → corps JSON (illisible = `null`) → `validateDeckInput` → 400 avec le message ou `deck.create` avec ses cartes.

## 4. Flux concret

« Save » dans le constructeur → deck créé → redirection vers `/deck/<id>`.

## 5. Points d'attention

- Le deck appartient toujours à `session.userId` (jamais un id fourni par le client).

## 6. Questions probables en évaluation

- **Peut-on créer un deck avec des cartes qu'on n'a pas ?** Non, 400.
