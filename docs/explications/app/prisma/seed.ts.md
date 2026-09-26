# `app/prisma/seed.ts`

> Service : **app** · script TypeScript · remplissage initial

## 1. Rôle

Lancé par `prisma db seed` à chaque démarrage : insère/met à jour les **cartes** du catalogue, puis — **hors production uniquement** — les comptes de test.

## 2. Dépendances

- **Importe** : `@prisma/client`, `pg`, `@prisma/adapter-pg`, `./seeds/cards.seed`, `./seeds/users.seed`.

## 3. Explication bloc par bloc

`main()` puis déconnexion propre ; code de sortie 1 en cas d'erreur.

## 4. Flux concret

`make` → « Seeding 76 cards… Users successfully seeded » (en dev).

## 5. Points d'attention

- Les comptes de test (mots de passe publics) ne doivent jamais exister en production.

## 6. Questions probables en évaluation

- **D'où viennent les cartes ?** De `seeds/data/tcg-collection.json`, via ce seed.
