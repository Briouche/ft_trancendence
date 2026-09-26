# `app/app/api/decks/[id]/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · modifier / supprimer un deck

## 1. Rôle

`PUT /api/decks/:id` (remplace nom et cartes) et `DELETE /api/decks/:id`, uniquement sur un deck **de l'utilisateur** (sinon 404, sans révéler qu'il existe).

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/session.ts`, `lib/decks.ts`.

## 3. Explication bloc par bloc

- `parseDeckId` : id non numérique → 404.
- PUT : vérifie le propriétaire, valide, puis **transaction** « supprimer les anciennes cartes + recréer » (jamais de deck vidé en cas d'échec).
- DELETE : `deleteMany({ id, userId })` — la condition de propriétaire est dans la requête même ; les cartes du deck partent en cascade.

## 4. Flux concret

Modifier son deck puis « Save » → PUT.

## 5. Points d'attention

- Un deck d'un autre joueur répond 404 comme un deck inexistant.

## 6. Questions probables en évaluation

- **Un utilisateur peut-il modifier le deck d'un autre ?** Non : filtre `userId` dans chaque requête.
