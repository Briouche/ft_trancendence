# `app/game/objects/Target.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · Objet Phaser (TypeScript) · cible

## 1. Rôle

Une cible possible (emplacement de serviteur ou héros) : zone de dépôt + anneau de surlignage. Exporte `ResolvedTarget` (héros ou serviteur avec son id).

## 2. Dépendances

- **Utilisé par** : `board/TargetRegistry.ts`, `board/Board.ts`, `InputController`.

## 3. Explication bloc par bloc

`resolve()` renvoie ce qui occupe la cible ; `setHighlighted` affiche l'anneau.

## 4. Flux concret

Pendant une visée, les cibles légales sont surlignées.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
