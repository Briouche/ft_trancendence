# `app/app/api/friends/[userId]/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · retirer un ami

## 1. Rôle

`DELETE /api/friends/:userId` : met fin à l'amitié avec cet utilisateur.

## 2. Dépendances

- **Importe** : `lib/api.ts`, `lib/friends.ts` (`removeFriend`), `lib/validation.ts`.

## 3. Explication bloc par bloc

Id validé (`idSchema`) → `removeFriend` (suppression conditionnelle, dans les deux sens) → 404 si ce n'était pas un ami.

## 4. Flux concret

Bouton « Remove » (avec confirmation) sur `/friends`.

## 5. Points d'attention

- Les deux personnes sont notifiées en temps réel.

## 6. Questions probables en évaluation

- **Comment retirer un ami ?** Ce bouton / cette route.
