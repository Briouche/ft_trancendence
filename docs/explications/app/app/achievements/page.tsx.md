# `app/app/achievements/page.tsx`

> Service : **app** · Server Component (page) · `/achievements`

## 1. Rôle

Page des succès — les dos de cartes à débloquer (réservée aux connectés) ; rend `AchievementsView`.

## 2. Dépendances

- **Importe** : `lib/session.ts`, `config/routes.ts`, `./AchievementsView`.

## 3. Explication bloc par bloc

`getSession()` ; pas de session → redirection vers `/`.

## 4. Flux concret

Menu du compte → Achievements.

## 5. Points d'attention

- Les données sont chargées côté client par `AchievementsView` (lecture seule, rien n'est débloqué ici).

## 6. Questions probables en évaluation

- **Où sont les règles de progression ?** Affichées en haut de cette page.
