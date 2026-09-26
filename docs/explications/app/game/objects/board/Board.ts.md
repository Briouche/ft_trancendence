# `app/game/objects/board/Board.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · Objet Phaser (TypeScript) · plateau

## 1. Rôle

Tout ce qui est sur la table sauf les mains : deux rangées de serviteurs, héros, jauges de mana, pioches, bouton de fin de tour, et les **cibles** (attaques et sorts).

## 2. Dépendances

- **Importe** : `CardRow`, `TargetRegistry`, `Target`, `Hero`, `ManaBar`, `Deck`, `EndTurn`, `BoardMath`, `EventManager`.
- **Utilisé par** : `GameScene`, `StateSyncController`, `ServerEventPlayer`, `InputController`.

## 3. Explication bloc par bloc

- `layout()` : placement proportionnel à la fenêtre.
- `syncBoardFromState` : rangées, mana, pioches.
- `findInsertIndex(x)` : où insérer un serviteur déposé.
- `getLegalAttackTargetIds`, `getLegalSpellTargetIds`, `setTargetHighlights` : aide visuelle (provocation incluse).
- `getTargetById` / `findCardById` : retrouver un objet depuis un id du serveur.

## 4. Flux concret

Déposer un serviteur entre deux autres → `findInsertIndex` → `boardIndex` envoyé au serveur.

## 5. Points d'attention

- Le calcul des cibles « légales » côté client n'est qu'une aide ; le serveur décide.

## 6. Questions probables en évaluation

- Aucune spécifique.
