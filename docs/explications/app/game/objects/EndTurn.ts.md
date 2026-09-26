# `app/game/objects/EndTurn.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · Objet Phaser (TypeScript) · bouton « End Turn »

## 1. Rôle

Le bouton de fin de tour (émet `client:endTurn` au clic, via le plateau).

## 2. Dépendances

- **Utilisé par** : `board/Board.ts`.

## 3. Explication bloc par bloc

Un `Container` (fond + texte) redimensionnable.

## 4. Flux concret

Clic → le serveur passe la main à l'adversaire (ou à l'IA).

## 5. Points d'attention

- Le serveur refuse si ce n'est pas votre tour.

## 6. Questions probables en évaluation

- Aucune spécifique.
