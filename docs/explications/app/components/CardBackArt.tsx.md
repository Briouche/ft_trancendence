# `app/components/CardBackArt.tsx`

> Service : **app** · Composant React · dos de carte

## 1. Rôle

Image d'un dos de carte (`/textures/cards/backs/<index>.webp`) ajustée à son conteneur, en pixel art net.

## 2. Dépendances

- **Importe** : `next/image`.
- **Utilisé par** : collection, paquets, vitrine.

## 3. Explication bloc par bloc

`Image` avec `fill`, `objectFit: contain`, `unoptimized` (pixel art).

## 4. Flux concret

Onglet « card backs » de la collection.

## 5. Points d'attention

- `alt=""` : image décorative (le contexte donne l'information).

## 6. Questions probables en évaluation

- Aucune spécifique.
