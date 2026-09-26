# `app/game/scenes/gameProcessors/StateSyncController.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript · application de l'état

## 1. Rôle

Applique chaque état reçu du serveur aux objets de la table (en les créant au premier état), détecte les cartes piochées pour animer la pioche, et exécute les animations qui attendaient qu'une carte existe. Restaure une **demande de cible** après une reconnexion.

## 2. Dépendances

- **Importe** : objets `Hand`, `Board`, `OpponentHand`, `MatchHistory`, `Card`, animation de pioche, `GameFlowState`.
- **Utilisé par** : `GameScene`.

## 3. Explication bloc par bloc

- Premier état → création de la table (`onTableCreated`).
- `detectDraws` : ids présents maintenant mais pas avant → animation depuis le deck.
- Synchronisation plateau, main adverse, main, héros, tour.
- `pendingPrompt` dans l'état alors que le client ne l'a pas → la demande est réaffichée (sinon le joueur serait bloqué : le serveur n'accepte plus que `targetChoice`).

## 4. Flux concret

Rechargement de la page pendant qu'on choisit une cible → la flèche de ciblage réapparaît.

## 5. Points d'attention

- L'état du serveur fait **toujours** foi : c'est lui qui corrige toute divergence d'affichage.

## 6. Questions probables en évaluation

- Aucune spécifique.
