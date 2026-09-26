# `app/game/animations/buff.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · Animation (TypeScript) · buff.ts

## 1. Rôle

Changement de stats : lueur + nombres « +1/+2 » (rouge si c'est une baisse). Renvoie une promesse résolue à la fin (sauf `shared.ts` et `hover.ts`), pour que la file d'animations attende.

## 2. Dépendances

- **Importe** : `phaser`, `objects/card/Card.ts` selon le cas, `./shared`.
- **Utilisé par** : `ServerEventPlayer`, `StateSyncController` (pioche), `Hand` (survol).

## 3. Explication bloc par bloc

Rien à jouer si les deux variations sont nulles.

## 4. Flux concret

Voir `ServerEventPlayer.ts.md`.

## 5. Points d'attention

- Toujours résoudre la promesse, même si la cible disparaît (sinon `AnimationQueue` attend jusqu'à son délai de sécurité).

## 6. Questions probables en évaluation

- Aucune spécifique.
