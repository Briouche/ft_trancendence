# `app/lib/achievementCatalog.ts`

> Service : **app** · TypeScript (client et serveur) · ~70 lignes · la liste des succès.

## 1. Rôle

Les 10 succès du jeu (titre, description, statistique mesurée, objectif, palier de badge,
récompense) et le calcul de progression. Importable côté navigateur (page `/achievements`).

## 2. Dépendances

- **Utilisé par** : `lib/achievements.ts`, `app/achievements/AchievementsView.tsx`,
  `components/ui/TierBadge.tsx` (type), tests.

## 3. Explication bloc par bloc

| Clé | Objectif | Badge | Paquets |
|---|---|---|---|
| first_victory | 1 victoire | bronze | 1 |
| veteran | 10 parties | argent | 1 |
| duelist | 5 victoires PvP | or | 2 |
| machine_breaker | battre l'IA difficile | or | 2 |
| pack_rat | 10 paquets ouverts | bronze | 1 |
| collector | 40 cartes différentes | argent | 1 |
| completionist | collection complète | or | 3 |
| social_butterfly | 3 amis | bronze | 1 |
| chatterbox | 20 messages | bronze | 1 |
| rising_star | 1100 Elo (départ 1000) | argent | 2 |

`progressFraction(def, value)` : `(valeur − départ) / (objectif − départ)`, borné entre 0 et 1
(l'Elo part de 1000, pas de 0).

## 4. Flux concret

La barre de « Veteran » à 4 parties : 4/10 = 40 %.

## 5. Points d'attention

- Ajouter un succès : une ligne dans `ACHIEVEMENTS` (voir `02_MODIFICATIONS_EVAL.md`).

## 6. Questions probables en évaluation

- **Quelles sont les règles de progression ?** Affichées sur `/achievements` et codées ici.
