# `game_engine/tests/validateMessage.test.ts`

> Service : **game_engine** · tests de la validation des messages clients.

## 1. Rôle

Vérifie `isDifficulty` (y compris `"__proto__"` refusé), `isDeckId` (entiers positifs seulement)
et `isWellFormed` (types des champs de chaque message).

## 2. Dépendances

- **Importe** : `socket/validateMessage.ts`.

## 3. Ce qui est testé

Cas valides et invalides pour chaque fonction (chaîne à la place d'un nombre, champ manquant,
`null`, message qui n'est pas un objet…).

## 4. Flux concret

`npm test -- tests/validateMessage.test.ts`.

## 5. Points d'attention

- Ajouter un type de message au protocole → ajouter son cas dans `isWellFormed` et ici.

## 6. Questions probables en évaluation

- **Un client peut-il envoyer n'importe quoi ?** Il peut l'envoyer, mais c'est rejeté (testé ici).
