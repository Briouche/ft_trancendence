# `app/game/scenes/gameProcessors/InputController.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript · interactions du joueur

## 1. Rôle

Toute l'interaction à la souris : **glisser-déposer** une carte (poser un serviteur à un endroit précis, lancer un sort sur une cible, attaquer) et **clic-puis-clic** (sélectionner puis cibler), flèche de visée, surlignage des cibles légales, annulation en cliquant ailleurs que sur une cible valide. Envoie les intentions via `EventManager` et attend la réponse du serveur.

## 2. Dépendances

- **Importe** : `phaser`, `EventManager`, `Board`, `Hand`, `Card`, `Target`, `TargetArrow`, `GameFlowState`, animations.
- **Utilisé par** : `GameScene`.

## 3. Explication bloc par bloc

- `register()` : écouteurs Phaser (`dragstart`, `drag`, `drop`, `pointerdown`…).
- `handleCardDrop` : sur le plateau → serviteur (index d'insertion calculé) ; sur une cible → sort ou attaque.
- `handleMinionTargetedDrop` : le serviteur est posé tout de suite, puis on vise sa cible de cri de guerre avec la flèche.
- `requestPlayCard` : marque la carte « en attente » (`awaitingServer`) et émet `client:playCard`.
- `finalizeSpellTarget` : garde la cible choisie pour répondre automatiquement au `prompt` du serveur.
- `clearWaitingState(restaurer)` : remet tout à zéro ; après un refus, la carte revient en main.

## 4. Flux concret

Glisser une carte de sort sur un serviteur ennemi → `playCard` → le serveur envoie `prompt` → réponse `targetChoice` automatique avec la cible déjà choisie.

## 5. Points d'attention

- Le surlignage des cibles « légales » est une aide ; la légalité réelle est vérifiée par le serveur.

## 6. Questions probables en évaluation

- **Le client peut-il jouer un coup illégal ?** Il peut l'envoyer, mais le serveur le refuse (message « Illegal target »).
