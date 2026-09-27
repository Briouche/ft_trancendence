# `app/app/api/achievements/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · succès (dos de cartes)

## 1. Rôle

`GET /api/achievements` : les 5 dos de cartes à débloquer, avec la progression du joueur connecté
(`{ achievements: CardBackAchievement[] }`).

## 2. Dépendances

- **Importe** : `lib/api.ts` (`requireSession`), `lib/achievements.ts` (`getCardBackAchievements`).

## 3. Explication bloc par bloc

`requireSession` (401 sans session) → `getCardBackAchievements(userId)` → JSON.

## 4. Flux concret

Ouverture de `/achievements` → `AchievementsView` appelle cette route.

## 5. Points d'attention

- Lecture seule : aucun effet de bord, l'appel peut être répété sans risque.

## 6. Questions probables en évaluation

- **Où voit-on sa progression ?** Sur `/achievements`, alimentée par cette route.
