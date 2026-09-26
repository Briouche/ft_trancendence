# `game_engine/srcs/ai/determinize.ts`

> Service : **game_engine** · TypeScript · ~25 lignes · gérer l'information cachée.

## 1. Rôle

L'IA ne doit pas voir la main de son adversaire. `determinize` clone la partie et **remplace la
main adverse** par une main tirée au hasard parmi les cartes qu'il pourrait avoir (sa main + son
deck), en gardant le même nombre de cartes.

## 2. Dépendances

- **Importe** : `gameEngine.ts`, `player.ts`, `card.ts`, `ai/utils.ts`, `deck.ts`.
- **Utilisé par** : `ai/mcts.ts`.

## 3. Explication bloc par bloc

```ts
const clone = engine.clone();
const pool = [...opponent.hand.getCards(), ...opponent.deck.getCards()];
const shuffled = shuffle(pool);
replaceHand(opponent.hand, shuffled.slice(0, hiddenCount));   // main plausible
opponent.deck = new Deck(shuffled.slice(hiddenCount));        // le reste redevient le deck
```

## 4. Flux concret

Bob a 4 cartes en main et 12 dans son deck : chaque « monde » de l'IA lui prête 4 cartes au
hasard parmi ces 16.

## 5. Points d'attention

- L'IA connaît la **composition** du deck adverse (les 16 cartes), pas leur répartition : c'est
  l'équivalent d'un joueur qui connaît la liste de cartes de son adversaire.

## 6. Questions probables en évaluation

- **Ton IA triche-t-elle ?** Non : elle ne voit jamais la main réelle, elle raisonne sur des
  mains possibles.
