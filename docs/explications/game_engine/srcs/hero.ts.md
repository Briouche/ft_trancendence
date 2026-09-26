# `game_engine/srcs/hero.ts`

> Service : **game_engine** · TypeScript · ~40 lignes · le héros (points de vie du joueur).

## 1. Rôle

Le héros porte les **points de vie** du joueur (20 au départ) : la partie est perdue quand ils
tombent à 0. Il est `Targetable` comme un serviteur (on peut l'attaquer, le soigner).

## 2. Dépendances

- **Importe** : rien.
- **Utilisé par** : `player.ts`, `gameEngine.ts`, `effect.ts`, `target.ts`,
  `socket/serverSocket.ts` (création avec le nom du joueur), les tests.

## 3. Explication bloc par bloc

- `maxHealth = 20`, `currentHealth` initialisé au max, `name` (pseudo ou « AI »), `id`
  (`hero-0` / `hero-1`, utilisé par le client pour viser le héros).
- `takeDamage(n)` : peut descendre sous 0 (la partie se termine alors).
- `heal(n)` : plafonné à `maxHealth`, renvoie le soin réellement appliqué.
- `clone()` : copie pour l'IA.

## 4. Flux concret

Un serviteur 3/3 attaque le héros d'Alice : `hero.takeDamage(3)` → 17 PV ;
`GameEngine.isTerminal()` reste faux.

## 5. Points d'attention

- La légendaire Timmy change les PV : `maxHealth = 999999`, `currentHealth = 25`
  (`legendary.ts`).
- `clone()` ne recopie ni l'id ni `maxHealth` : sans effet sur les simulations de l'IA, qui
  désignent le héros par l'index `-1` et ne regardent que `currentHealth`.

## 6. Questions probables en évaluation

- **Comment changer les PV de départ ?** `maxHealth = 20` ici.
- **Quand la partie se termine-t-elle ?** Quand un héros a ≤ 0 PV (`GameEngine.isTerminal`).
