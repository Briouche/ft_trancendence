# `app/components/library/Lantern.tsx`

> Service : **app** · Client Component (three.js) · lanterne

## 1. Rôle

Le projecteur chaud qui accompagne la caméra : fixe devant elle, ou qui suit la souris (`mode: 'mouse-track'`).

## 2. Dépendances

- **Importe** : `@react-three/fiber`, `three`, `./theme` (`LANTERN`).
- **Utilisé par** : `app/HubScene.tsx`.

## 3. Explication bloc par bloc

Projection de la souris sur un plan face à la caméra pour orienter la lumière.

## 4. Flux concret

Bouger la souris dans le hub → la lumière suit.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
