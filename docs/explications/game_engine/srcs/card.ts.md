# `game_engine/srcs/card.ts`

> Service : **game_engine** · TypeScript · ~135 lignes · les cartes côté serveur.

## 1. Rôle

Définit les trois classes de cartes manipulées par le moteur :
- `Card` (abstraite) : nom, coût en mana, description, id, rareté, image (`assetKey`), et
  l'éventuel **passif de légendaire** ;
- `MinionCard` : un serviteur, avec attaque, PV (actuels, max, de base), `canAttack`, et ses
  **effets/mots-clés** (`effects`) ;
- `SpellCard` : un sort, avec un seul `effect` joué à l'utilisation.

## 2. Dépendances

- **Importe** : `effect.ts` (type `Effect`), `legendary.ts` (type `legendary`).
- **Utilisé par** : presque tout le moteur (`gameEngine.ts`, `deck.ts`, `hand.ts`, `board.ts`,
  `player.ts`, `target.ts`, `effect.ts`, `legendary.ts`), `cardImport/cardLoader.ts` (création depuis
  la base), `socket/gameSession.ts`, `socket/toClientState.ts`, `ai/*`, les tests.

## 3. Explication bloc par bloc

### `Card`

`getLeg()` renvoie le passif de légendaire (ex. `"freddy"`) : `Player.checkDeckForLeg` le lit en
début de partie. `cloneCopy()` (abstraite) : copie **qui garde l'id** — utilisée pour cloner mains
et decks (l'IA doit retrouver les cartes par id).

### `Keywords` (interface)

Les « crochets » d'un serviteur : `battlecry`, `deathrattle`, `onAttack`, `onDamage`,
`startOfTurnEffect`, `endOfTurnEffect` (des `Effect`) et des booléens `rush`, `taunt`,
`cannotAttack`, `archi`, plus `spellpower` (bonus aux dégâts des sorts).

### `MinionCard`

```ts
clone(): MinionCard {
    const copy = new MinionCard(this.id + nextTokenId++, …, { ...this.effects }, …);
    copy.currentHealth = this.currentHealth;
    copy.canAttack = this.canAttack;
    return copy;
}
```

Deux copies différentes :
- `clone()` donne un **nouvel id** (`nextTokenId`) : sert aux **invocations** (deux jetons
  « araignée » doivent être visables séparément) et au clonage du plateau par l'IA ;
- `cloneCopy()` **garde l'id** : sert aux cartes en main/dans le deck.

`takeDamage`, `heal` (plafonné à `maxHealth`, renvoie le soin réel), `isAlive` (PV > 0).
`jeffeBuff` mémorise le +1 d'attaque donné par le passif de Jeffe.

### `SpellCard`

Un sort n'a qu'un `effect`. Il n'est jamais posé sur le plateau.

## 4. Flux concret

Le chargeur crée `new MinionCard("hey" + id + "_3", "Pyroblin", 3, "Battlecry: deal 3", 2, 2,
{ battlecry: DamageEffect(3, AnyCharacterResolver) }, …)` ; le préfixe/suffixe rendent l'id
unique dans la partie (deux exemplaires de la même carte).

## 5. Points d'attention

- `cloneCopy` ne recopie pas le passif de légendaire (`undefined`) : ce n'est pas un problème car
  le passif est lu une seule fois en début de partie et recopié par `Player.clone`.
- Les ids de cartes circulent jusqu'au client : ils servent à désigner les cartes dans les
  messages (`playCard { cardId }`).

## 6. Questions probables en évaluation

- **Différence entre `clone` et `cloneCopy` ?** Nouvel id (jetons, plateau simulé) vs même id
  (main, deck).
- **Où sont les stats d'une carte ?** `attack`, `currentHealth`, `maxHealth` (modifiables), et
  `baseAttack`/`baseMaxHealth` (valeurs imprimées, rétablies par le silence).
