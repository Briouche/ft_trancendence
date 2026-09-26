# `game_engine/tests/gameEngine.test.ts`

> Service : **game_engine** · tests des règles.

## 1. Rôle

Vérifie les règles du moteur sans réseau ni base.

## 2. Dépendances

- **Importe** : `vitest`, `tests/helpers.ts`.

## 3. Ce qui est testé

| Test | Règle |
|---|---|
| game start | 3 cartes chacun (+1 au second joueur), mana 1 au premier tour |
| mana grows… up to 7 | mana max plafonnée à 7 |
| refuses a card the player can't afford | coût en mana |
| holds at most 6 minions | `MAX_BOARD_SIZE` |
| minions trade damage | dégâts croisés, les morts quittent le plateau |
| attacks once per turn | `canAttack` |
| taunt minions must be attacked first | provocation (`getLegalActions`) |
| a damage spell can finish the enemy hero | sort ciblé + condition de victoire |
| fatigue | dégâts croissants quand le deck est vide |
| clone isolation | simuler sur un clone ne touche pas la vraie partie (IA) |

## 4. Flux concret

`cd game_engine && npm test`.

## 5. Points d'attention

- Si une règle change (PV, mana…), mettre à jour le test correspondant.

## 6. Questions probables en évaluation

- **As-tu des tests ?** Oui : règles, IA, Elo, validation des messages (23 tests côté jeu).
