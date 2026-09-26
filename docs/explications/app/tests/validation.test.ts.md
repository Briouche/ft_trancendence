# `app/tests/validation.test.ts`

> Service : **app** · tests (vitest) · schémas zod

## 1. Rôle

Vérifie tous les schémas de `lib/validation.ts` : normalisation (minuscules, espaces), cas refusés (noms invalides, mots de passe faibles, emails mal formés, confirmation différente, decks invalides, messages vides/trop longs) et valeurs par défaut de la recherche.

## 2. Dépendances

- **Importe** : `lib/validation.ts`.

## 3. Explication bloc par bloc

`describe`/`it.each` sur des tableaux de cas.

## 4. Flux concret

`cd app && npm test`.

## 5. Points d'attention

- Changer une règle de validation → adapter ces tests.

## 6. Questions probables en évaluation

- **Testez-vous la validation ?** Oui.
