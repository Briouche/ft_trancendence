# `app/game/shared/protocol.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript (types) · contrat client ↔ serveur

## 1. Rôle

**Copie identique** de `game_engine/srcs/shared/protocol.ts` : voir sa page (`docs/explications/game_engine/srcs/shared/protocol.ts.md`). Types de tous les messages et de l'état envoyé au client.

## 2. Dépendances

- **Utilisé par** : `EventManager.ts`, les scènes et objets du jeu.

## 3. Explication bloc par bloc

Voir la page de la copie serveur.

## 4. Flux concret

—

## 5. Points d'attention

- Toute modification doit être recopiée dans l'autre copie (`diff` doit être vide).

## 6. Questions probables en évaluation

- **Pourquoi deux copies ?** Chaque service est construit depuis son propre dossier Docker.
