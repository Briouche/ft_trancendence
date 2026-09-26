# `game_engine/srcs/hand.ts`

> Service : **game_engine** · TypeScript · ~50 lignes · la main d'un joueur.

## 1. Rôle

Liste ordonnée des cartes en main, limitée à **10** (`MAX_HAND_SIZE`).

## 2. Dépendances

- **Importe** : `card.ts`.
- **Utilisé par** : `player.ts`, `ai/utils.ts` (`replaceHand`), `gameEngine.ts` via le joueur.

## 3. Explication bloc par bloc

- `add(card)` : refuse (renvoie `false`) si la main est pleine — la carte est alors **perdue**
  (règle classique des jeux de cartes).
- `play(index)` : retire et renvoie la carte à cet index.
- `getCards()` : renvoie une **copie** du tableau (on ne peut pas modifier la main de l'extérieur
  par erreur).
- `clone()` : copie (avec `cloneCopy`, mêmes ids) pour l'IA.

## 4. Flux concret

`GameEngine.playCard(2, …)` appelle `player.hand.play(2)` : la 3ᵉ carte quitte la main.

## 5. Points d'attention

- Les index changent après chaque carte jouée : c'est pour ça que le client et le serveur
  désignent les cartes par **id**, et que seule l'IA (qui travaille sur un état figé) utilise des
  index.

## 6. Questions probables en évaluation

- **Que se passe-t-il si on pioche avec 10 cartes en main ?** La carte est brûlée (perdue).
