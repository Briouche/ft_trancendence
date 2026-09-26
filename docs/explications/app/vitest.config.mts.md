# `app/vitest.config.mts`

> Service : **app** · configuration des tests · vitest

## 1. Rôle

Tests dans `tests/**/*.test.ts` en environnement Node ; alias `@` → `app/` et `server-only` → un module vide (ce paquet lève une erreur hors du bundle serveur de Next).

## 2. Dépendances

- `vitest/config`.

## 3. Explication bloc par bloc

`resolve.alias` + `test.include`.

## 4. Flux concret

`npm test`.

## 5. Points d'attention

- Les tests ciblent la logique serveur (validation, uploads, limites, succès).

## 6. Questions probables en évaluation

- **Comment testez-vous du code « server-only » ?** En remplaçant ce paquet par un module vide dans les tests.
