# `app/game/objects/GameOverOverlay.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · Objet Phaser (TypeScript) · écran de fin

## 1. Rôle

Voile sombre + résultat (« YOU WIN!! » / « YOU LOSE :( » ou raison d'un refus fatal) + ligne de **récompenses** (paquets, Elo, dos de carte) ; cliquable après 2 s pour revenir au hub.

## 2. Dépendances

- **Importe** : `EventManager` (`phaser:navigateHome`), `gameFontRegistry`.
- **Utilisé par** : `GameScene`.

## 3. Explication bloc par bloc

Position recalculée au redimensionnement ; écouteur retiré à la destruction de la scène.

## 4. Flux concret

Victoire en PvP → « YOU WIN!! » puis « +2 packs · Elo +16 ».

## 5. Points d'attention

- Le délai de 2 s évite un clic accidentel.

## 6. Questions probables en évaluation

- **Où voit-on ce qu'on a gagné ?** Ici, puis dans le hub (toasts) et le profil.
