# `app/app/api/achievements/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · succès

## 1. Rôle

`GET /api/achievements` : tous les succès avec progression, et ceux débloqués par cet appel (`newlyUnlocked`).

## 2. Dépendances

- **Importe** : `lib/api.ts`, `lib/achievements.ts`.

## 3. Explication bloc par bloc

`requireSession` → `getAchievementStatuses`.

## 4. Flux concret

Ouverture de `/achievements`.

## 5. Points d'attention

- L'appel peut accorder des paquets (déblocage).

## 6. Questions probables en évaluation

- **Où voit-on sa progression ?** `/achievements`, alimentée par cette route.
