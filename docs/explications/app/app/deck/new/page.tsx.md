# `app/app/deck/new/page.tsx`

> Service : **app** · Server Component (page) · `/deck/new`

## 1. Rôle

Constructeur de deck vide : charge la collection (quantité possédée = limite par carte), les decks sauvegardés et le total du catalogue.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/session.ts`, `config/routes.ts`, `./DeckBuilder`.

## 3. Explication bloc par bloc

`getSession()` ; pas de session → redirection vers `/`. `dynamic = "force-dynamic"` (toujours à jour).

## 4. Flux concret

Nouveau deck → sélection des cartes → Save.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
