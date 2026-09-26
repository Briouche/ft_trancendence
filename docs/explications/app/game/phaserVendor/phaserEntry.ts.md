# `app/game/phaserVendor/phaserEntry.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · CommonJS (tiers) · Phaser allégé

## 1. Rôle

Copie du point d'entrée officiel de Phaser **sans le moteur physique Arcade** (jamais utilisé ici), branchée à la place du paquet `phaser` par un alias de `next.config.ts` : le bundle du jeu est plus léger.

## 2. Dépendances

- **Utilisé par** : tout `import Phaser from "phaser"` (via l'alias).

## 3. Explication bloc par bloc

Liste de `require(...)` identique à l'original moins une ligne ; `@ts-nocheck` (code tiers non typé) ; exclu du lint.

## 4. Flux concret

—

## 5. Points d'attention

- Les limites connues (son et plugin Facebook toujours inclus à cause de tests `typeof` du code de Phaser) sont décrites en tête du fichier.

## 6. Questions probables en évaluation

- Aucune spécifique.
