# `app/app/deck/[id]/page.tsx`

> Service : **app** · Server Component (page) · `/deck/:id`

## 1. Rôle

Ouvre le constructeur sur un deck existant **du joueur** (404 pour un autre ou un id invalide).

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/session.ts`, `lib/decks.ts` (`parseDeckId`), `config/routes.ts`, `../new/DeckBuilder`.

## 3. Explication bloc par bloc

`parseDeckId` → `notFound()` si invalide ; `deck.userId !== session.userId` → `notFound()`.

## 4. Flux concret

Clic sur un deck dans la liste de droite du constructeur.

## 5. Points d'attention

- Ne révèle pas l'existence des decks des autres.

## 6. Questions probables en évaluation

- **Peut-on ouvrir le deck d'un autre ?** Non, 404.
