# `app/app/packs/PackArt.tsx`

> Service : **app** · Composant · visuel de paquet

## 1. Rôle

Découpe un design de paquet dans une planche de sprites (9 teintes × 20 motifs) ; `randomPackSkins(n)` en tire n différents.

## 2. Dépendances

- **Utilisé par** : `PackChoice`, `PackOpener`.

## 3. Explication bloc par bloc

Calcul de `background-position` et `background-size` à l'échelle voulue ; `image-rendering: pixelated`.

## 4. Flux concret

3 designs différents à chaque visite.

## 5. Points d'attention

- Tirés après le montage (sinon le rendu serveur et le rendu client différeraient).

## 6. Questions probables en évaluation

- Aucune spécifique.
