# `app/tests/rateLimit.test.ts`

> Service : **app** · tests (vitest) · limites de débit

## 1. Rôle

Vérifie : `max` tentatives puis refus, clés indépendantes, nouvelle fenêtre après expiration (horloge simulée), et que seules les tentatives enregistrées comptent (échecs de connexion).

## 2. Dépendances

- **Importe** : `lib/rateLimit.ts` ; `next/headers` simulé.

## 3. Explication bloc par bloc

`vi.useFakeTimers()` pour avancer le temps.

## 4. Flux concret

`npm test`.

## 5. Points d'attention

- `resetRateLimits` entre les tests.

## 6. Questions probables en évaluation

- Aucune spécifique.
