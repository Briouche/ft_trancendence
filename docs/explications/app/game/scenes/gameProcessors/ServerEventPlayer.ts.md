# `app/game/scenes/gameProcessors/ServerEventPlayer.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript · lecture des événements

## 1. Rôle

Pour chaque `GameEvent` du serveur, joue l'animation correspondante (attaque, dégâts, soin, buff, carte jouée, invocation, mort, fin de tour, effet) et l'ajoute à l'**historique** de la partie.

## 2. Dépendances

- **Importe** : `Board`, `Card`, `CardPreview`, toutes les animations, `MatchHistory`, protocole.
- **Utilisé par** : `GameScene` (via `AnimationQueue`).

## 3. Explication bloc par bloc

Un `switch` sur `event.type` ; chaque méthode retrouve la cible par id sur le plateau, met à jour l'affichage (PV, stats) et attend la fin de l'animation. Une carte pas encore créée → animation différée (`deferUntilCardExists`).

## 4. Flux concret

Événement `damage { targetId: "hero-1", amount: 3 }` → secousse + « -3 » sur le héros adverse, PV mis à jour.

## 5. Points d'attention

- L'ordre des animations est celui du serveur.

## 6. Questions probables en évaluation

- Aucune spécifique.
