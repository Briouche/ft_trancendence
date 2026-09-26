# `app/game/phaserVendor/phaser3spectorjsStub.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · CommonJS (tiers) · bouchon Spector

## 1. Rôle

Classe inerte qui remplace l'outil de débogage WebGL `phaser3spectorjs` (dépendance de dev de Phaser, non installée ici) : le code de Phaser l'instancie toujours dans cette configuration, un objet vide ferait planter le démarrage.

## 2. Dépendances

- **Utilisé par** : Phaser (via l'alias de `next.config.ts`).

## 3. Explication bloc par bloc

Méthodes vides.

## 4. Flux concret

—

## 5. Points d'attention

- Ne pas supprimer : sans lui, le jeu ne démarre pas.

## 6. Questions probables en évaluation

- Aucune spécifique.
