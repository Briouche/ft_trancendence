# `app/app/api/user/summary/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · statistiques du hub

## 1. Rôle

`GET /api/user/summary` : nombre de cartes, Elo, paquets non ouverts, victoires par mode et
nombre de dos de cartes débloqués / total, pour le hub.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/api.ts`, `lib/cardBacks.ts` (`CARD_BACK_COUNT`).
- **Utilisé par** : `app/HubBackground.tsx`.

## 3. Explication bloc par bloc

`requireSession` → lecture des champs de l'utilisateur (`select` ciblé) → somme des exemplaires
possédés (`aggregate` sur `UserCard.qty`) → JSON.

## 4. Flux concret

Retour au hub après une partie → les chiffres (Elo, paquets, victoires) sont à jour.

## 5. Points d'attention

- Lecture seule, appelée à chaque affichage du hub.

## 6. Questions probables en évaluation

- **Pourquoi `aggregate` ?** La somme est calculée par PostgreSQL au lieu de charger toutes les
  lignes de la collection.
