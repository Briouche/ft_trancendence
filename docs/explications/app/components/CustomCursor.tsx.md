# `app/components/CustomCursor.tsx`

> Service : **app** · Client Component · curseur personnalisé

## 1. Rôle

Remplace le curseur par un sprite pixel art qui suit la souris, avec une animation de clic en 4 images.

## 2. Dépendances

- **Utilisé par** : `app/layout.tsx` (le curseur natif est masqué dans `globals.css`).

## 3. Explication bloc par bloc

Position par `transform` (pas de re-rendu React à chaque mouvement) ; écouteurs `mousemove`/`mousedown` retirés au démontage ; invisible tant que la souris n'a pas bougé.

## 4. Flux concret

Clic → l'animation joue puis revient au curseur normal.

## 5. Points d'attention

- Sur écran tactile, il n'apparaît pas (pas d'événement souris).

## 6. Questions probables en évaluation

- Aucune spécifique.
