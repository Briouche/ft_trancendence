# `app/components/ui/TierBadge.tsx`

> Service : **app** · Composant React · badge de succès

## 1. Rôle

Pastille médaille + titre, en bronze, argent ou or ; version grisée pour un succès verrouillé.

## 2. Dépendances

- **Importe** : type `BadgeTier` de `lib/achievementCatalog.ts`.
- **Utilisé par** : `AchievementsView`, `PublicProfileView`, vitrine.
- **Design system** : composant listé dans `docs/DESIGN_SYSTEM.md`, visible sur `/design-system`.

## 3. Explication bloc par bloc

`TIER_STYLE`, `TIER_ICON`, attribut `title` descriptif.

## 4. Flux concret

Profil public → section Badges.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- **Qu'est-ce qu'un badge dans votre projet ?** Un succès débloqué, affiché avec son palier.
