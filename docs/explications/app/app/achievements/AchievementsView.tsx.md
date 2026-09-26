# `app/app/achievements/AchievementsView.tsx`

> Service : **app** · Client Component · la page des succès

## 1. Rôle

Affiche les **règles** (objectif, récompense, badge, gains de victoire, Elo, dos de cartes), le compteur « X / 10 unlocked », chaque succès avec son **badge**, sa **barre de progression** et sa date, et la liste des dos de cartes à gagner.

## 2. Dépendances

- **Importe** : `PageShell`, `Panel`, `ProgressBar`, `TierBadge`, `TextLink`, `useToast`, `lib/cardBacks.ts`, `lib/achievementCatalog.ts`, `config/routes.ts`.

## 3. Explication bloc par bloc

- `useEffect` → `fetch('/api/achievements')` → état ; un toast par clé de `newlyUnlocked`.
- Chaque carte de succès : `TierBadge` (grisé s'il est verrouillé), description, `ProgressBar` (`progressFraction`), « 4 / 10 » ou « Unlocked <date> ».

## 4. Flux concret

Après 3 amis ajoutés → la page affiche « Social Butterfly » débloqué + toast « +1 pack ».

## 5. Points d'attention

- Les dates sont formatées dans le fuseau du navigateur (`suppressHydrationWarning`).

## 6. Questions probables en évaluation

- **Quel retour visuel pour la gamification ?** Barres de progression, badges, toasts, écran de fin de partie.
