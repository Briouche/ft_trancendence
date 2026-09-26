# `game_engine/srcs/board.ts`

> Service : **game_engine** · TypeScript · ~55 lignes · le plateau.

## 1. Rôle

Les deux rangées de serviteurs, une par joueur, limitées à `MAX_BOARD_SIZE` (6). L'ordre du
tableau **est** la position sur le plateau : les « voisins » d'un serviteur sont les index
adjacents.

## 2. Dépendances

- **Importe** : `card.ts` (`MinionCard`).
- **Utilisé par** : `gameEngine.ts` (et `MAX_BOARD_SIZE` pour ses vérifications), `effect.ts`
  (invocations), `target.ts` via le moteur.

## 3. Explication bloc par bloc

- `MAX_BOARD_SIZE = 6` (exporté : source unique de la limite).
- `playMinion(joueur, serviteur, index = -1)` : ajoute à la fin, ou insère à `index` (le joueur
  choisit où poser en glissant la carte).
- `getMinions(joueur)` : la rangée (le tableau lui-même, pas une copie).
- `collectDead` / `clearDead` : lister puis retirer les serviteurs à 0 PV (utilisés par
  `GameEngine.processDeaths`).
- `clone()` : clone chaque serviteur (`MinionCard.clone`, nouveaux ids).

## 4. Flux concret

Alice glisse un serviteur entre ses deux premiers : le client envoie `boardIndex: 1`,
`GameSession` vérifie `0 ≤ 1 ≤ taille`, puis `board.playMinion(0, carte, 1)`.

## 5. Points d'attention

- `getMinions` renvoie le tableau interne : ne pas le modifier ailleurs que par les méthodes du
  plateau.

## 6. Questions probables en évaluation

- **Combien de serviteurs par joueur ?** 6, `MAX_BOARD_SIZE`.
- **Comment sont gérés les voisins ?** Par les index du tableau (`NeighboringMinionsResolver`,
  `cleaveEffect`).
