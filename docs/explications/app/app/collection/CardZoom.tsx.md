# `app/app/collection/CardZoom.tsx`

> Service : **app** · Client Component · zoom sur une carte

## 1. Rôle

Affiche une carte en grand avec une **inclinaison 3D** qui suit la souris ; se ferme au clic à l'extérieur ou avec Échap. Affiche l'artiste.

## 2. Dépendances

- **Importe** : `ScaledCardFace`.

## 3. Explication bloc par bloc

Écouteurs `mousemove` et `keydown` ajoutés à l'ouverture et **retirés** au démontage (pas de fuite) ; `transform: perspective() rotateY() rotateX()`.

## 4. Flux concret

Clic sur une carte de la collection.

## 5. Points d'attention

- Même principe que `packs/PackCardZoom.tsx`.

## 6. Questions probables en évaluation

- Aucune spécifique.
