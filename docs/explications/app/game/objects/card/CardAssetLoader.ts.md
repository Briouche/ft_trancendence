# `app/game/objects/card/CardAssetLoader.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript · chargement des illustrations

## 1. Rôle

Cadre de carte par rareté, et chargement **à la demande** des illustrations (il y en a trop pour tout précharger), partagé entre toutes les cartes qui en ont besoin.

## 2. Dépendances

- **Utilisé par** : `card/Card.ts`, `card/CardPreview.ts`, `history/historyIcons.ts`.

## 3. Explication bloc par bloc

- `resolveInitialCardArt` : texture si déjà chargée, sinon indique qu'il faut la charger.
- `ensureCardArt` : un seul téléchargement par image même si 3 cartes la demandent en même temps (`inFlightKeys`), chaque demandeur est prévenu une fois (succès ou échec).

## 4. Flux concret

Première apparition d'une carte → illustration chargée puis affichée.

## 5. Points d'attention

- Une image absente laisse le cadre sans illustration (pas d'erreur bloquante).

## 6. Questions probables en évaluation

- Aucune spécifique.
