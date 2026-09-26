# `app/lib/decks.ts`

> Service : **app** · TypeScript (serveur) · ~70 lignes · validation d'un deck.

## 1. Rôle

Valide un deck envoyé par le navigateur **contre la collection réelle** du joueur avant de
l'enregistrer.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/deckRules.ts`, `lib/validation.ts`.
- **Utilisé par** : `app/api/decks/route.ts`, `app/api/decks/[id]/route.ts`, `app/deck/[id]/page.tsx`.

## 3. Explication bloc par bloc

- `parseDeckId(raw)` : entier positif ou `null` (→ 404).
- `validateDeckInput(body, userId)` :
  1. forme (`deckBodySchema`) ;
  2. pas deux fois la même carte ;
  3. le joueur possède **au moins** autant d'exemplaires de chaque carte ;
  4. au plus 1 légendaire et 20 autres cartes (`deckRules.ts`).

## 4. Flux concret

Un joueur modifie la requête pour mettre 3 légendaires qu'il n'a pas → 400 « Deck uses cards you
don't own ».

## 5. Points d'attention

- Le serveur de jeu revérifie la possession au lancement de la partie
  (`game_engine/srcs/cardImport/cardLoader.ts`).

## 6. Questions probables en évaluation

- **Peut-on tricher sur son deck ?** Non : vérifié à l'enregistrement et au lancement.
