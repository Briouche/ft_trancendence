# `app/game/scenes/gameProcessors/GameFlowState.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript · état de déroulement

## 1. Rôle

Petit objet partagé par les contrôleurs : mon index de joueur, est-ce mon tour, attend-on le serveur, une cible, la demande de cible en cours, la carte en cours de jeu, la cible déjà choisie.

## 2. Dépendances

- **Utilisé par** : `GameScene`, `StateSyncController`, `InputController`.

## 3. Explication bloc par bloc

Champs publics initialisés à « rien en cours ».

## 4. Flux concret

Pendant qu'une carte est jouée, `awaitingServer` bloque les autres interactions.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
