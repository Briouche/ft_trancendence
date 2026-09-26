# `app/game/objects/TargetArrow.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · Objet Phaser (TypeScript) · flèche de visée

## 1. Rôle

Flèche en pointillés courbe (courbe de Bézier quadratique) de la carte vers le pointeur pendant le choix d'une cible.

## 2. Dépendances

- **Utilisé par** : `InputController`.

## 3. Explication bloc par bloc

`draw()` calcule des points le long de la courbe ; `updateEnd()` suit la souris ; `destroy()` au choix ou à l'annulation.

## 4. Flux concret

Poser un serviteur à cri de guerre → la flèche part de lui.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
