# `app/tests/achievements.test.ts`

> Service : **app** · tests (vitest) · progression des succès (dos de cartes)

## 1. Rôle

Vérifie `lib/achievements.ts` sans base de données : ordre de la liste (dos 3 à 7), victoires
plafonnées à l'objectif et état « débloqué » lu depuis `unlockedCardBacks`, progression de la
collection comptée en exemplaires (plafonnée au maximum par carte), et liste des dos gagnés pour
le profil.

## 2. Dépendances

- **Importe** : `lib/achievements.ts`, `lib/cardBacks.ts` ; `vi.mock('@/lib/prisma')` remplace
  le client Prisma par des fonctions qui renvoient des données d'exemple (`server-only` est
  neutralisé par la configuration vitest).

## 3. Explication bloc par bloc

Chaque test fixe les réponses de `user.findUniqueOrThrow`, `userCard.findMany` et
`card.findMany`, puis compare le résultat attendu (4 tests).

## 4. Flux concret

`npm test` (dans `app/`).

## 5. Points d'attention

- Le déblocage lui-même (mise à jour conditionnelle) est dans `matchResults.ts` / `lib/packs.ts`.

## 6. Questions probables en évaluation

- **Comment tester sans base ?** En simulant le module Prisma (`vi.mock`).
