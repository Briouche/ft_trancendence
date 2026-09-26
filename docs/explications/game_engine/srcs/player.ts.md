# `game_engine/srcs/player.ts`

> Service : **game_engine** · TypeScript · ~100 lignes · un joueur dans une partie.

## 1. Rôle

Regroupe tout ce qui appartient à **un siège** : héros, deck, main, mana (actuelle et maximum),
fatigue, index (0 ou 1), passif de légendaire et ses compteurs, dos de carte.

## 2. Dépendances

- **Importe** : `deck.ts`, `hand.ts`, `hero.ts`, `card.ts`, `legendary.ts` (type).
- **Utilisé par** : `gameEngine.ts`, `effect.ts`, `legendary.ts`, `socket/serverSocket.ts`
  (création), `socket/gameSession.ts`, `socket/toClientState.ts`, `ai/*`, les tests.

## 3. Explication bloc par bloc

- `MAX_MANA = 7` : plafond de mana (le jeu va de 1 à 7).
- `gainMana()` : +1 mana max (jusqu'à 7), puis mana actuelle = max. Appelé à chaque début de tour.
- `spendMana(n)` : retire la mana si possible.
- `drawCard()` :

```ts
if (this.deck.isEmpty()) {
    this.hero.takeDamage(this.fatigue);   // 1, puis 2, puis 3…
    this.fatigue++;
    return false;
}
this.hand.add(this.deck.draw()!);         // main pleine (10) : la carte est perdue
```

- `checkDeckForLeg()` : la première carte légendaire du deck donne son passif pour toute la
  partie (un deck en contient au plus une, règle du constructeur de deck).
- `clone()` : copie profonde pour l'IA (main, deck, héros, mana, compteurs).

## 4. Flux concret

Début du tour 5 d'Alice : `gainMana()` → 5/5, puis `drawCard()` ; si son deck est vide, son héros
prend la fatigue.

## 5. Points d'attention

- Changer la mana maximale : `MAX_MANA` ici (voir `02_MODIFICATIONS_EVAL.md`).
- `cardBack` est purement cosmétique (index dans `app/lib/cardBacks.ts`).

## 6. Questions probables en évaluation

- **Que se passe-t-il quand le deck est vide ?** Fatigue croissante (1, 2, 3…) à chaque pioche.
- **Comment la mana évolue-t-elle ?** +1 par tour jusqu'à 7, rechargée à chaque tour.
