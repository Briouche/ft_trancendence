# `app/game/objects/Hand.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · Objet Phaser (TypeScript) · main du joueur

## 1. Rôle

La main du joueur, disposée en **éventail** en bas de l'écran ; synchronisée avec l'état du serveur (ajout/retrait des cartes, carte jouable ou non selon la mana et le tour).

## 2. Dépendances

- **Importe** : `card/Card.ts`, animations de survol.
- **Utilisé par** : `StateSyncController`, `InputController`, `GameScene`.

## 3. Explication bloc par bloc

- `layout()` : positions et rotations en arc, recalculées au redimensionnement.
- `syncHandFromState(cartes, monTour, mana)` : crée les nouvelles cartes, retire les absentes, met à jour les données.
- `extractCard` / `returnCard` : sortir une carte de l'éventail pendant qu'on la glisse, et l'y remettre si le coup est refusé.

## 4. Flux concret

Nouvelle carte piochée → elle apparaît (animation de pioche) et l'éventail se resserre.

## 5. Points d'attention

- Les cartes sont identifiées par **id** (celui du serveur).

## 6. Questions probables en évaluation

- Aucune spécifique.
