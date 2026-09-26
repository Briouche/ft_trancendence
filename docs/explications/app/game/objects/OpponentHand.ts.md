# `app/game/objects/OpponentHand.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · Objet Phaser (TypeScript) · main adverse

## 1. Rôle

Dos de cartes en éventail en haut de l'écran : **un par carte** que tient l'adversaire (seul le nombre est connu).

## 2. Dépendances

- **Importe** : `OpponentCard.ts`.
- **Utilisé par** : `StateSyncController`.

## 3. Explication bloc par bloc

`setCount(n)` ajoute/retire des dos ; `layout()` les dispose.

## 4. Flux concret

L'adversaire pioche → un dos de plus.

## 5. Points d'attention

- Le client ne connaît jamais les cartes adverses.

## 6. Questions probables en évaluation

- **Le client peut-il voir la main adverse ?** Non, il n'en reçoit que le nombre.
