# `app/app/api/user/summary/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · statistiques du hub

## 1. Rôle

`GET /api/user/summary` : cartes, Elo, paquets, victoires par mode, dos de cartes — et **déblocage des succès** atteints depuis la dernière visite (`newAchievements`).

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/api.ts`, `lib/cardBacks.ts`, `lib/achievements.ts`.

## 3. Explication bloc par bloc

`evaluateAchievements` d'abord (les paquets gagnés sont inclus dans les chiffres), puis lecture des stats et somme des cartes (`aggregate`).

## 4. Flux concret

Retour au hub après une partie → toasts des succès.

## 5. Points d'attention

- Appelée à chaque retour sur `/`.

## 6. Questions probables en évaluation

- **Quand les succès sont-ils vérifiés ?** Au retour au hub, sur `/achievements` et à l'ouverture d'un paquet.
