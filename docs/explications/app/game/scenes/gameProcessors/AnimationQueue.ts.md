# `app/game/scenes/gameProcessors/AnimationQueue.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript · file d'animations

## 1. Rôle

Joue les animations **une par une, dans l'ordre du serveur**, et ne permet d'appliquer un nouvel état qu'une fois la file vide (le dernier état reçu seulement). Conçue pour ne **jamais se bloquer** : une animation qui échoue ou ne se termine pas n'empêche pas la suite.

## 2. Dépendances

- **Importe** : `phaser`, protocole.
- **Utilisé par** : `GameScene`.

## 3. Explication bloc par bloc

- `run(task)` : chaîne de promesses ; erreur attrapée (sinon toute la chaîne resterait rejetée).
- `withTimeout` : une tâche non terminée après 5 s (horloge de la **scène**, qui se met en pause quand l'onglet est caché) est abandonnée.
- `reset()` (reconnexion) : incrémente une *génération* : les tâches anciennes sont ignorées, la file repart propre, les rappels de fin sont exécutés.
- `runAfterDrain(fn)` : exécute `fn` quand tout est joué (utilisé pour l'écran de fin).

## 4. Flux concret

Une attaque (animation) puis 2 dégâts puis une mort : joués à la suite, puis l'état final est appliqué.

## 5. Points d'attention

- Les messages console restants (tâche en échec / abandonnée) ne se produisent que sur une vraie anomalie.

## 6. Questions probables en évaluation

- **Comment gères-tu la latence ?** Le client anime les événements dans l'ordre puis se recale sur l'état envoyé par le serveur.
