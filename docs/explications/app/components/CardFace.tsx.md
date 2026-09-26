# `app/components/CardFace.tsx`

> Service : **app** · Composant React · dessin d'une carte (HTML)

## 1. Rôle

Dessine une carte (cadre de rareté, illustration, nom, coût, description avec mots-clés en gras, attaque/PV, quantité possédée) en HTML/CSS, à une taille de référence de 400 px.

## 2. Dépendances

- **Importe** : `lib/keywords.ts`, `lib/cardLayout.ts`.
- **Utilisé par** : `ScaledCardFace`, `ManualBook`, types dans les pages collection/decks/paquets.

## 3. Explication bloc par bloc

Positions en % (`cardLayout.ts`, les mêmes que le rendu Phaser) ; taille du nom adaptée à sa longueur ; chiffres blancs contournés de noir.

## 4. Flux concret

Chaque carte de la collection.

## 5. Points d'attention

- Taille fixe : utiliser `ScaledCardFace` pour l'adapter à un conteneur.

## 6. Questions probables en évaluation

- Aucune spécifique.
