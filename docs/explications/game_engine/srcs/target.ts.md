# `game_engine/srcs/target.ts`

> Service : **game_engine** · TypeScript · ~350 lignes · « qui peut être visé ? »

## 1. Rôle

Définit :
- `Targetable` : tout ce qui peut subir des dégâts ou être soigné (serviteurs et héros) ;
- les **resolvers** : des objets qui, pour un effet donné, renvoient la liste des cibles.

Un resolver a un drapeau `requiresInput` :
- `true` → le **joueur choisit** une cible parmi la liste (le serveur envoie un `prompt`) ;
- `false` → la liste **est** la cible (tous les serviteurs, un ennemi au hasard, les voisins…).

C'est ici que vit la règle de la **provocation** (*taunt*).

## 2. Dépendances

- **Importe** : `card.ts` (`MinionCard`), `hero.ts`, `effect.ts` (type `GameContext`).
- **Utilisé par** : `effect.ts`, `gameEngine.ts` (attaques légales), `cardImport/effectFactory.ts`
  (construit les resolvers depuis le JSON), `deck.ts`, `socket/gameSession.ts`
  (`EnemyCharacterResolver` pour valider les attaques).

## 3. Explication bloc par bloc

### `TargetResolver` (classe abstraite)

```ts
protected tauntFilter(targets, enemyMinions) {
    const tauntMinions = enemyMinions.filter(m => m.effects && m.effects.taunt);
    if (tauntMinions.length > 0) return tauntMinions;   // provocation : seuls eux sont visables
    return targets;
}
protected opponentIndex(context) { return context.owner.index === 0 ? 1 : 0; }
```

### Resolvers « le joueur choisit » (`super(true)`)

| Classe | Cibles proposées |
|---|---|
| `AnyCharacterResolver` | tous les serviteurs et les deux héros (ignore la provocation) |
| `EnemyCharacterResolver` | serviteurs ennemis + héros ennemi, **provocation respectée** ; un attaquant « rush » ne peut pas viser le héros |
| `EnemyMinionResolver` | serviteurs ennemis, provocation respectée |
| `AnyMinionResolver` | tous les serviteurs |
| `AllyMinionResolver` | un de ses propres serviteurs |

`EnemyCharacterResolver` sert aussi à **valider les attaques** (dans `GameSession.handleAttack`
et `GameEngine.getLegalActions`).

### Resolvers automatiques (`super(false)`)

`EnemyHeroResolver`, `AllCharactersResolver`, `AllMinionsResolver`, `AllEnemyMinionsResolver`,
`AllEnemiesResolver`, `BothHeroesResolver`, `PlayerHeroResolver` (son propre héros),
`AlliedMinionsResolver`, `OtherAlliedMinionsResolver` (sauf la source),
`DamagedAlliedMinionsResolver` (alliés blessés), `SourceResolver` (la carte elle-même),
`RandomEnemyResolver` (un ennemi vivant au hasard, **nouveau tirage à chaque appel**),
`NeighboringMinionsResolver` (voisins gauche/droite de la source ; l'ordre du tableau = la
position sur le plateau).

## 4. Flux concret

Alice attaque avec un serviteur alors que Bob a un serviteur à provocation :
1. Le client envoie `attack { attackerId, targetId: "hero-1" }`.
2. `GameSession.handleAttack` appelle `new EnemyCharacterResolver().resolve(...)` : la liste
   contient **seulement** le serviteur à provocation (`tauntFilter`).
3. Le héros n'y est pas → rejet `illegal target`. Le client affiche « Illegal target ».

## 5. Points d'attention

- Les sorts « à cible » utilisent souvent `AnyCharacterResolver`, qui **ignore** la provocation
  (comme dans Hearthstone : la provocation ne protège que des attaques).
- `RandomEnemyResolver` renvoie un tableau d'un élément ; `RandomMissileEffect` le rappelle à
  chaque projectile.
- Ajouter un resolver : classe ici + `kind` dans `ResolverSpec` et `case` dans `buildResolver`
  (`cardImport/effectFactory.ts`).

## 6. Questions probables en évaluation

- **Où est implémentée la provocation ?** `tauntFilter`, utilisé par `EnemyCharacterResolver` et
  `EnemyMinionResolver`.
- **Pourquoi un serviteur « rush » ne peut-il pas attaquer le héros ?** Règle du jeu : il peut
  attaquer dès sa pose, mais seulement des serviteurs ; codé dans `EnemyCharacterResolver`.
- **Comment le serveur sait-il qu'il faut demander une cible ?** `resolver.requiresInput`.
