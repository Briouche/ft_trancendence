# `app/app/api/friends/requests/[id]/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · répondre / annuler une demande

## 1. Rôle

`PATCH { action: "accept" | "decline" }` : le **destinataire** répond. `DELETE` : le **demandeur** annule.

## 2. Dépendances

- **Importe** : `zod`, `lib/api.ts`, `lib/friends.ts`, `lib/validation.ts`.

## 3. Explication bloc par bloc

Id validé → corps validé (`z.enum`) → `answerFriendRequest` / `cancelFriendRequest` (conditions de rôle et de statut dans la requête) → 404 si la demande n'existe pas ou n'est pas pour lui.

## 4. Flux concret

Bob clique « Accept » → PATCH → Alice voit Bob dans ses amis sans recharger.

## 5. Points d'attention

- Impossible d'accepter une demande qui ne vous est pas adressée.

## 6. Questions probables en évaluation

- **Comment accepter une demande ?** Ce PATCH, depuis `/friends` ou le profil.
