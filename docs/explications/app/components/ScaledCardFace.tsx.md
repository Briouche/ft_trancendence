# `app/components/ScaledCardFace.tsx`

> Service : **app** · Client Component · carte à la taille du conteneur

## 1. Rôle

Affiche `CardFace` à sa taille de référence puis la **met à l'échelle** de la largeur du conteneur ; peut dessiner une seconde copie décalée derrière (pile) et griser chaque couche.

## 2. Dépendances

- **Importe** : `./CardFace`.
- **Utilisé par** : collection, constructeur de deck, paquets, zooms.

## 3. Explication bloc par bloc

`ResizeObserver` → `scale(largeur / 400)` ; observateur déconnecté au démontage.

## 4. Flux concret

Une carte dans une case de 120 px ou en zoom à 340 px : même dessin.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
