# `game_engine/srcs/deck.ts`

> Service : **game_engine** · TypeScript · ~155 lignes · la pioche d'un joueur.

## 1. Rôle

- La classe `Deck` : la pile de cartes à piocher (mélange, pioche, taille, clone).
- `makeBasicDeck` : des decks **codés en dur** utilisés uniquement par l'outil de diagnostic de
  l'IA (`ai/aiDiagnostic.ts`) et qui ne servent jamais dans une vraie partie (les vrais decks
  viennent de la base via `cardImport/cardLoader.ts`).

## 2. Dépendances

- **Importe** : `card.ts`, `effect.ts` et `target.ts` (pour construire les decks de test).
- **Utilisé par** : `player.ts`, `socket/serverSocket.ts`, `cardImport/cardLoader.ts`,
  `ai/determinize.ts`, `ai/aiDiagnostic.ts`, les tests.

## 3. Explication bloc par bloc

```ts
shuffle(): void {       // Fisher-Yates : chaque ordre a la même probabilité
    for (let i = this.cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
}
draw(): Card | null { return this.cards.length === 0 ? null : this.cards.pop()!; }
```

`getCards()` renvoie le tableau interne (utilisé par l'IA pour reconstituer ce que l'adversaire
pourrait avoir en main), `clone()` copie avec les mêmes ids.

## 4. Flux concret

`GameEngine.startGame()` mélange chaque deck puis pioche 3 (ou 4) cartes.

## 5. Points d'attention

- `makeBasicDeck` contient des noms de cartes de prototype : c'est normal, il n'est utilisé que
  pour les statistiques de l'IA.

## 6. Questions probables en évaluation

- **Comment mélanges-tu ?** Fisher-Yates, uniforme.
