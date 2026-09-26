# `app/prisma/seeds/users.seed.ts`

> Service : **app** · script TypeScript · comptes de test (dev)

## 1. Rôle

Crée les comptes de `data/users-collection.json` (mots de passe hachés argon2) **s'ils n'existent pas** ; ne réécrit jamais un compte existant (un mot de passe changé dans l'application reste changé).

## 2. Dépendances

- **Importe** : `@prisma/client`, `@node-rs/argon2`, `fs`, `path`.
- **Utilisé par** : `prisma/seed.ts` (hors production).

## 3. Explication bloc par bloc

`upsert` avec `update: {}`.

## 4. Flux concret

Comptes `alexvanguard/test1`, `elenaspellweaver/test2`, `kaicyberblade/test3` en dev.

## 5. Points d'attention

- Jamais exécuté en production.

## 6. Questions probables en évaluation

- Aucune spécifique.
