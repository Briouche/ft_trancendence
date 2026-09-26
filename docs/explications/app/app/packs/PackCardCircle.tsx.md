# `app/app/packs/PackCardCircle.tsx`

> Service : **app** · Client Component · révélation en cercle

## 1. Rôle

Dispose les cartes du paquet en cercle ; chacune se retourne au clic (effet 3D), avec une lueur de rareté au survol ; une fois tout révélé, boutons « autre paquet » et « voir ma collection ».

## 2. Dépendances

- **Importe** : `ScaledCardFace`, `CardBackArt`, `AssetButton`.

## 3. Explication bloc par bloc

Tailles en `vmin` (proportionnelles à l'écran) ; retournement par `rotateY(180deg)` et `backface-visibility`.

## 4. Flux concret

Clic sur une carte cachée → elle se retourne.

## 5. Points d'attention

- Les boutons icônes ont un nom accessible.

## 6. Questions probables en évaluation

- Aucune spécifique.
