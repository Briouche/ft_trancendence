# `app/components/ui/ProgressBar.tsx`

> Service : **app** · Composant React · barre de progression

## 1. Rôle

Barre accessible (`role="progressbar"`, `aria-valuenow`, libellé) ; verte quand c'est terminé.

## 2. Dépendances

- **Utilisé par** : `AchievementsView`, vitrine.
- **Design system** : composant listé dans `docs/DESIGN_SYSTEM.md`, visible sur `/design-system`.

## 3. Explication bloc par bloc

Valeur entre 0 et 1 convertie en pourcentage ; largeur animée.

## 4. Flux concret

« Veteran : 4 of 10 » → 40 %.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- **Quel retour visuel pour la progression ?** Ces barres.
