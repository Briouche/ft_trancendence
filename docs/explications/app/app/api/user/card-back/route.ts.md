# `app/app/api/user/card-back/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · équiper un dos de carte

## 1. Rôle

`POST { cardBack }` : équipe un dos de carte **débloqué**.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/session.ts`, `lib/cardBacks.ts`.

## 3. Explication bloc par bloc

Index valide (`isValidCardBack`) sinon 400 ; pas débloqué → 403 ; sinon mise à jour.

## 4. Flux concret

Onglet « card backs » de la collection → clic sur un dos.

## 5. Points d'attention

- L'interface ne propose que les dos débloqués.

## 6. Questions probables en évaluation

- **Peut-on équiper un dos non débloqué ?** Non, 403.
