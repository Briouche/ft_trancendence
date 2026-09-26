# `game_engine/srcs/effect.ts`

> Service : **game_engine** · TypeScript · ~590 lignes · tout ce qu'une carte peut « faire ».

## 1. Rôle

Définit les **effets** des cartes : infliger des dégâts, soigner, piocher, renforcer, invoquer,
réduire au silence, détruire… Chaque effet est une classe avec une méthode `execute(context)`.
Une carte possède des effets branchés sur des **moments** (cri de guerre à la pose, râle
d'agonie à la mort, début/fin de tour, à l'attaque, quand elle subit des dégâts, ou l'effet d'un
sort).

**Pourquoi des classes** : les cartes sont décrites en JSON en base (`effectFactory.ts` les
transforme en objets) ; une fois construits, le moteur n'a pas besoin de savoir quel effet il
déclenche, il appelle simplement `execute`.

## 2. Dépendances

- **Importe** : `card.ts`, `gameEngine.ts` (type), `player.ts`, `target.ts` (resolvers,
  `PlayerHeroResolver`), `hero.ts`, `board.ts` (`MAX_BOARD_SIZE`).
- **Utilisé par** : `card.ts` (les cartes portent des effets), `gameEngine.ts` (déclenche),
  `cardImport/effectFactory.ts` (construit depuis le JSON), `deck.ts` (decks de test),
  `legendary.ts` (squelette de Freddy), `socket/gameSession.ts` et `toClientState.ts` (types),
  `ai/tree.ts`, `target.ts` (type `GameContext`).

## 3. Explication bloc par bloc

### `GameContext`

```ts
export interface GameContext {
    engine: GameEngine;   // pour lire/modifier la partie et noter les animations
    owner: Player;        // le joueur qui contrôle l'effet
    source: Card;         // la carte qui déclenche
    target?: Targetable;  // la cible choisie par le joueur (si l'effet en demande une)
    bonusDamage?: number; // puissance des sorts (spellpower) pour les sorts
}
```

### `Effect` (classe abstraite)

```ts
export abstract class Effect {
    public resolver: TargetResolver | null;   // qui est visé ?
    abstract execute(context: GameContext): void;
}
```

Schéma commun à presque tous les effets :
- si le *resolver* **demande un choix** (`requiresInput`) → agir sur `context.target` (déjà
  validée par `GameSession`) ;
- sinon → agir sur **toutes** les cibles renvoyées par `resolver.resolve(context)`.

Chaque effet **note** ce qu'il fait (`engine.recordDamage`, `recordHeal`, `recordBuff`,
`recordAnimationChain`) pour que le client puisse l'animer.

### Les effets

| Classe | Effet | Détail utile |
|---|---|---|
| `DrawCardEffect(n)` | le propriétaire pioche n cartes | pas de cible |
| `DamageEffect(n, r)` | n dégâts (+ `bonusDamage`) | `recordDamage` déclenche aussi « quand il subit des dégâts » |
| `HealEffect(n, r)` | soigne jusqu'à n | n'enregistre que le soin réel (`heal()` renvoie le montant appliqué) |
| `BuffEffect(atk, pv, r)` | +attaque/+PV | l'attaque ne descend pas sous 0 ; un héros ne reçoit que les PV |
| `CountScaledBuffEffect` | buff × nombre de cibles d'un autre resolver | ex. « +1/+1 par allié » |
| `AddEffectfEffect` | donne un mot-clé (provocation, rush) ou un effet (râle…) | |
| `silenceEffect` | retire tous les mots-clés, remet les stats imprimées | un serviteur « ne peut pas attaquer » réduit au silence peut attaquer tout de suite |
| `SummonMinionEffect(tokens, n)` | invoque des copies de jetons | tant qu'il reste de la place (`MAX_BOARD_SIZE`) ; un jeton « rush » peut attaquer |
| `CombinedEffect([...])` | plusieurs effets à la suite | au plus un d'entre eux peut demander une cible (il donne son resolver au combiné) |
| `RandomMissileEffect(n, dmg, r)` | n projectiles, cible au hasard à chaque fois | ignore les cibles déjà mortes |
| `triggerDeathrattleEffect` | déclenche les râles d'agonie sans tuer | Freddy |
| `triggerEndOfTurnEffect` | déclenche les effets de fin de tour tout de suite | |
| `timmyDamageEffect` | dégâts = PV du héros au-delà de 20 | Timmy |
| `archiDamageEffect` | dégâts énormes si 6 cartes « archi » ont été jouées | condition de victoire d'Archimède |
| `lifestealEffect` | serviteur : soigne le héros de son attaque ; sort : n × nombre de serviteurs | |
| `destroyEffect` | dégâts égaux aux PV restants | = destruction, mais passe par le chemin normal des dégâts |
| `equalHealthEffect` | le héros le plus bas remonte au niveau de l'autre, les deux piochent | |
| `cleaveEffect` | à l'attaque, touche aussi les voisins de la cible | |
| `regenerationEffect` | fin de tour : se soigne complètement | |

## 4. Flux concret

Carte « Arcane missiles » (sort : 3 projectiles d'1 dégât sur des ennemis au hasard) :
1. `effectFactory` a construit `new RandomMissileEffect(3, 1, new RandomEnemyResolver())`.
2. Le joueur la joue : `GameEngine.playCard` calcule `bonusDamage` (puissance des sorts) et
   appelle `effect.execute({ engine, owner, source, bonusDamage })`.
3. À chaque projectile, `RandomEnemyResolver.resolve` tire un ennemi vivant, on lui retire
   `1 + bonus` PV et on appelle `recordDamage` (→ événement `damage` pour le client).
4. `playCard` termine par `processDeaths()`.

## 5. Points d'attention

- Un effet ne doit **jamais** retirer lui-même un serviteur mort du plateau : c'est
  `processDeaths()` qui le fait ensuite (les râles d'agonie doivent se déclencher dans l'ordre).
- Les noms en minuscule (`silenceEffect`, `cleaveEffect`…) sont un héritage : ce sont bien des
  classes.
- Ajouter un effet : classe ici + un `kind` dans `EffectSpec` et un `case` dans `buildEffect`
  (`cardImport/effectFactory.ts`) + utilisation dans le JSON des cartes.

## 6. Questions probables en évaluation

- **Comment une carte sait-elle ce qu'elle fait ?** Son JSON en base décrit ses effets ;
  `effectFactory` les transforme en objets `Effect` au chargement.
- **Comment l'effet choisit-il sa cible ?** Par son *resolver* (`target.ts`) : soit le joueur
  choisit parmi les cibles légales, soit c'est automatique (toutes, au hasard, voisins…).
- **Comment ajouterais-tu une carte qui soigne tous les alliés de 2 ?** Pas de code : dans le
  JSON, `{ "kind": "heal", "amount": 2, "resolver": { "kind": "alliedMinions" } }`.
