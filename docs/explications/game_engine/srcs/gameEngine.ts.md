# `game_engine/srcs/gameEngine.ts`

> Service : **game_engine** · TypeScript · ~430 lignes · le cœur des règles du jeu.

## 1. Rôle

`GameEngine` contient **l'état complet d'une partie** (les deux joueurs, le plateau, à qui c'est le
tour) et **toutes les règles** : début de partie, début/fin de tour, jouer une carte, attaquer,
résoudre les morts et les effets en chaîne. Il ne sait rien du réseau : il reçoit des ordres
(`playCard`, `attackWithMinion`, `endTurn`) et renvoie ce qui s'est passé sous forme
d'**événements d'animation**.

Il existe pour que les règles soient à **un seul endroit**, utilisées à l'identique par :
- une vraie partie (`socket/gameSession.ts`) ;
- l'IA, qui **clone** le moteur pour simuler des milliers de coups (`ai/tree.ts`) ;
- les tests (`tests/gameEngine.test.ts`).

## 2. Dépendances

- **Importe** : `card.ts` (MinionCard, SpellCard), `board.ts` (plateau, `MAX_BOARD_SIZE`),
  `player.ts`, `effect.ts` (GameContext, Effect), `target.ts` (Targetable,
  EnemyCharacterResolver), `hero.ts`, `legendary.ts` (passifs de Freddy, Jeffe, Timmy).
- **Utilisé par** : `socket/gameSession.ts`, `socket/toClientState.ts`, `ai/mcts.ts`,
  `ai/tree.ts`, `ai/determinize.ts`, `ai/policy.ts`, `ai/aiDiagnostic.ts`, `effect.ts` (via le
  contexte), `tests/helpers.ts`.

## 3. Explication bloc par bloc

### Types exportés

```ts
export type AnimationEvent =
    | { kind: "summon"; minion: MinionCard; playerIndex: 0 | 1 }
    | { kind: "damage"; target: Targetable; amount: number }
    | { kind: "heal"; ... } | { kind: "buff"; ... }
    | { kind: "effect"; sourceId: string; trigger: "passive" | "battlecry" | "deathrattle" }
    | { kind: "death"; minionId: string; playerIndex: 0 | 1 };
```

Journal **ordonné** de ce qui s'est passé pendant une action. `GameSession` le traduit en messages
`event` (protocole) que le client anime dans le même ordre. `ActionResult` =
`{ success, animationEvents }`. `Action` = un coup légal pour l'IA (`playCard` par index de
carte + index de cible, `attack` par index d'attaquant + index de cible, `-1` = héros ; `endTurn`).

### `startGame()`

```ts
for (let i = 0; i < 2; i++) {
    this.players[i].checkDeckForLeg();              // la légendaire du deck donne son passif
    if (this.players[i].legPassive === "timmy") timmyPassive(this.players[i]);
    this.players[i].deck.shuffle();
    for (let j = 0; j < 3; j++) this.players[i].drawCard();
    if (i === 1) this.players[i].drawCard();       // compensation du second joueur
}
return this.startTurn();
```

3 cartes chacun, une de plus pour celui qui joue en second (comme Hearthstone), puis début du
premier tour.

### `startTurn()`

Le joueur actif gagne 1 mana max (plafonné à 7, voir `player.ts`) et pioche. Ses serviteurs
peuvent de nouveau attaquer (sauf mot-clé `cannotAttack`), le mot-clé « rush » est consommé, et
les effets « début de tour » se déclenchent, chacun suivi de `processDeaths()`.

### `endTurn()` et `triggerMinionEndOfTurnEffect()`

Déclenche les effets « fin de tour » du joueur actif, change `currentTurn`, puis appelle
`startTurn()` pour l'autre joueur. Renvoie les deux listes d'événements séparément (le client les
joue dans l'ordre). Le passif « Roi des rats » : un effet de fin de tour sur trois se déclenche
deux fois (`roiDesRatsCount % 3 === 0`).

### `playCard(cardIndex, targets, boardIndex?)`

1. Refus (`success: false`) si la carte n'existe pas, coûte trop cher, ou si c'est un serviteur
   et que le plateau est plein (`MAX_BOARD_SIZE`).
2. Retire la carte de la main et dépense la mana.
3. **Serviteur** : posé (à `boardIndex` si fourni), compteur Archimède, cri de guerre exécuté
   avec la cible choisie (`targets.get(effect)`), la « rush » lui permet d'attaquer tout de suite.
4. **Sort** : `bonusDamage` = somme de la puissance des sorts (`spellpower`) de ses serviteurs ;
   effet exécuté ; passif Gertrude (un sort sur 4 revient en main).
5. `processDeaths()`.

Le paramètre `targets` est une `Map<Effect, cible | null>` : le moteur ne choisit **jamais** une
cible lui-même, c'est `GameSession` qui l'a validée avant (ou l'IA qui l'a choisie parmi les
cibles légales).

### `attackWithMinion(attackerIndex, target)`

Refus si l'attaquant n'existe pas ou ne peut pas attaquer. Sinon il est marqué comme ayant
attaqué, son effet « à l'attaque » se déclenche (s'il ne demande pas de cible), puis :
- **héros visé** : dégâts = attaque du serviteur ;
- **serviteur visé** : dégâts **croisés** (chacun prend l'attaque de l'autre ; on mémorise
  `target.attack` avant, car un effet pourrait la modifier).

La **légalité** de la cible (provocation, héros interdit pour un « rush ») n'est pas vérifiée ici :
c'est `EnemyCharacterResolver` qui produit les cibles légales, utilisé par `GameSession` et
`getLegalActions`.

### `processDeaths()` et `resolveDeaths()`

```ts
while (true) {
    const deadCurrent = this.board.collectDead(this.currentTurn);
    const deadOpponent = this.board.collectDead(opponentIndex);
    if (deadCurrent.length === 0 && deadOpponent.length === 0) break;
    this.board.clearDead(this.currentTurn); this.board.clearDead(opponentIndex);
    this.resolveDeaths(deadCurrent, this.currentTurn);
    this.resolveDeaths(deadOpponent, opponentIndex);
}
```

**Pourquoi une boucle** : un râle d'agonie peut tuer d'autres serviteurs, qui ont leurs propres
râles… On recommence jusqu'à ce qu'il n'y ait plus de mort. Les morts sont retirés du plateau
**avant** l'exécution des râles, pour qu'une invocation voie les places libérées. Freddy : un
squelette tous les 4 morts alliés.

### `recordDamage / recordHeal / recordBuff / recordAnimationChain`

Ajoutent un événement au journal. `recordDamage` déclenche aussi l'effet « quand il subit des
dégâts » du serviteur et le passif de Jeffe (+1 attaque aux serviteurs blessés).

### `clone()`

Copie profonde (joueurs, plateau, tour). Indispensable à l'IA : elle joue ses simulations sur des
clones, la vraie partie n'est jamais modifiée (test « clone » dans `tests/gameEngine.test.ts`).

### `getOnPlayEffect`, `getOnPlayTargets`, `getLegalActions`

- `getOnPlayEffect(card)` : l'effet déclenché en jouant la carte (sort ou cri de guerre).
- `getOnPlayTargets(card)` : les cibles légales de cet effet si le joueur doit en choisir une.
- `getLegalActions()` : **tous** les coups possibles, avec les mêmes vérifications que
  `playCard`/`attackWithMinion` (mana, plateau plein, cibles, provocation). Un sort sans cible
  légale n'est pas jouable ; un cri de guerre sans cible se joue « à vide ». `endTurn` est
  toujours possible.

### `isTerminal()` / `getWinner()`

Fin de partie quand un héros est à 0 PV ou moins. `getWinner` renvoie `null` en cas de double
mort (égalité) ou si la partie continue.

## 4. Flux concret

« Le joueur 0 joue *Pyroblin* (cri de guerre : 3 dégâts) sur le héros adverse » :
1. `GameSession.handlePlayCard` vérifie que la carte est dans sa main, voit que l'effet demande
   une cible, envoie un `prompt` au client ; le joueur clique le héros → `targetChoice`.
2. `GameSession.handleTargetChoice` revérifie que la cible est toujours légale puis appelle
   `engine.playCard(index, Map{ criDeGuerre → hérosAdverse })`.
3. Le moteur pose le serviteur (`summon`), note `effect: battlecry`, exécute `DamageEffect`
   (→ `damage` sur le héros), puis `processDeaths()`.
4. `GameSession` diffuse les événements puis l'état ; `checkGameOver()` voit si le héros est mort.

## 5. Points d'attention

- Les règles « numériques » sont dans d'autres fichiers : mana max (`player.ts`), main
  (`hand.ts`), plateau (`board.ts` → `MAX_BOARD_SIZE`), PV (`hero.ts`).
- `animationChain` est **réinitialisé** au début de chaque action publique : ne pas appeler
  `playCard` depuis un effet (on perdrait le journal en cours).
- `getLegalActions` doit rester le **miroir exact** des refus de `playCard` et
  `attackWithMinion` : sinon l'IA proposerait des coups refusés (ou en raterait).
- Les passifs de légendaires sont branchés ici par des `if (player.legPassive === …)` : ajouter une
  légendaire = ajouter son nom dans `legendary.ts` + son déclencheur ici.

## 6. Questions probables en évaluation

- **Où sont les règles du jeu ?** Ici. Le client n'a aucune règle : il affiche ce que le serveur
  envoie (moteur **autoritaire**).
- **Comment gères-tu les réactions en chaîne (un mort qui en tue un autre) ?** `processDeaths`
  boucle jusqu'à ce qu'il n'y ait plus de mort, et retire les morts avant leurs râles d'agonie.
- **Comment l'IA teste-t-elle des coups sans casser la partie ?** Elle travaille sur `clone()`.
- **Comment vérifies-tu qu'un coup est légal ?** Mana, place sur le plateau et existence ici ;
  cibles via les *resolvers* (`target.ts`) ; tour et appartenance de la carte dans `GameSession`.
- **Comment se décide la fin de partie ?** `isTerminal()` : un héros ≤ 0 PV ; `GameSession` appelle
  `checkGameOver()` après chaque action (et il y a aussi le forfait).
