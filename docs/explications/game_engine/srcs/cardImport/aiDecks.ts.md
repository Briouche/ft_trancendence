# `game_engine/srcs/cardImport/aiDecks.ts`

> Service : **game_engine** · TypeScript · ~40 lignes · les decks de l'IA.

## 1. Rôle

Trois decks de l'IA, décrits par **noms de cartes** (un nom répété = deux exemplaires) :
**Aggro** (petit coût), **Control** (sorts et grosses créatures), **Archimède** (combo des cartes
« archi »). `pickRandomAiDeck()` en choisit un au hasard à chaque partie solo.

## 2. Dépendances

- **Importe** : rien.
- **Utilisé par** : `socket/serverSocket.ts` (partie solo) → `cardLoader.makeDeckFromNames`.

## 3. Explication bloc par bloc

Tableaux de chaînes + `pickRandomAiDeck`. Les noms doivent correspondre **exactement** au champ
`name` des cartes en base (y compris les fautes d'orthographe des données, comme
« equal opportiny »).

## 4. Flux concret

`readySolo` → `makeDeckFromNames(pickRandomAiDeck(), "hola")`.

## 5. Points d'attention

- Un nom inconnu est ignoré avec un avertissement dans les logs (« typo in aiDecks.ts? ») : le
  deck serait alors plus court.

## 6. Questions probables en évaluation

- **L'IA peut-elle utiliser les options de personnalisation ?** Oui : trois decks différents et
  un dos de carte tiré au hasard.
