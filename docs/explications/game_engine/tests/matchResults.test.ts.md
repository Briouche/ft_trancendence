# `game_engine/tests/matchResults.test.ts`

> Service : **game_engine** · tests du calcul d'Elo.

## 1. Rôle

Vérifie `eloDeltas` : somme nulle, ±K/2 entre joueurs égaux, une victoire surprise rapporte plus,
jamais plus que K.

## 2. Dépendances

- **Importe** : `matchResults.ts` après avoir **simulé** `db.ts` (`vi.mock`) : le calcul d'Elo est
  pur, pas besoin de base.

## 3. Explication bloc par bloc

`vi.mock("../srcs/db", () => ({ prisma: {} }))` puis `await import(...)` : le module est chargé
avec le faux client.

## 4. Flux concret

`npm test -- tests/matchResults.test.ts`.

## 5. Points d'attention

- Les tests utilisent `ELO_K_FACTOR` : changer K ne casse pas les tests.

## 6. Questions probables en évaluation

- **Comment vérifies-tu ton Elo ?** Propriétés mathématiques testées ici.
