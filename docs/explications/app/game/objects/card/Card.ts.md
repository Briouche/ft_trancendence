# `app/game/objects/card/Card.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · Objet Phaser (TypeScript) · carte en jeu

## 1. Rôle

Une carte dans la main ou sur le plateau : cadre de rareté, illustration (chargée à la demande), nom, coût, description, stats colorées (vert si au-dessus de la valeur de base, rouge si en dessous), icônes d'effets (provocation, râle, etc.), état « en attente » pendant l'aller-retour serveur. Exporte `CardData` et `withStartingStats`.

## 2. Dépendances

- **Importe** : `lib/cardLayout.ts`, `cardTextLayout.ts`, `CardAssetLoader.ts`, `CardPreview.ts`, `gameFontRegistry`.
- **Utilisé par** : `Hand`, `CardRow`, `Board`, contrôleurs, animations.

## 3. Explication bloc par bloc

- `updateData`, `updateStats` : actualisation depuis le serveur ou pendant une animation.
- `setCardContext`, `setAvailableMana` : carte jouable ou non (surbrillance).
- `resize` : textes réajustés à la nouvelle taille.

## 4. Flux concret

Un serviteur buffé +1/+1 → stats en vert.

## 5. Points d'attention

- Les positions viennent de `lib/cardLayout.ts` (identiques au rendu HTML).

## 6. Questions probables en évaluation

- Aucune spécifique.
