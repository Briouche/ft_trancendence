# `app/game/objects/history/MatchHistory.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript · journal de partie

## 1. Rôle

Historique des actions : une entrée par carte jouée / attaque / fin de tour, avec les détails (dégâts, soins, morts…).

## 2. Dépendances

- **Utilisé par** : `ServerEventPlayer`, `HistoryStrip`, `HistoryOverlay`.

## 3. Explication bloc par bloc

`begin*` ouvre une entrée, `addDetail` y ajoute une ligne ; `getLatest(n)`.

## 4. Flux concret

« You played Pyroblin » → « Hero took 3 damage ».

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
