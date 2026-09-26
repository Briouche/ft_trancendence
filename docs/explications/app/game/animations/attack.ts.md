# `app/game/animations/attack.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · Animation (TypeScript) · attack.ts

## 1. Rôle

Attaque : recul, élan vers la cible (secousse de caméra à l'impact), retour. Renvoie une promesse résolue à la fin (sauf `shared.ts` et `hover.ts`), pour que la file d'animations attende.

## 2. Dépendances

- **Importe** : `phaser`, `objects/card/Card.ts` selon le cas, `./shared`.
- **Utilisé par** : `ServerEventPlayer`, `StateSyncController` (pioche), `Hand` (survol).

## 3. Explication bloc par bloc

Chaîne de tweens ; la promesse se résout au retour.

## 4. Flux concret

Voir `ServerEventPlayer.ts.md`.

## 5. Points d'attention

- Toujours résoudre la promesse, même si la cible disparaît (sinon `AnimationQueue` attend jusqu'à son délai de sécurité).

## 6. Questions probables en évaluation

- Aucune spécifique.
