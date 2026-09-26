# `app/game/scenes/GameScene.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript (scène Phaser) · la scène de partie

## 1. Rôle

Chef d'orchestre du client de jeu : reçoit les événements `server:*` et les confie aux bons contrôleurs, crée la table (main, plateau, main adverse, historique) au premier état, affiche la déconnexion de l'adversaire, les refus (message éphémère), la fin de partie avec les **récompenses**.

## 2. Dépendances

- **Importe** : objets (`Hand`, `Board`, `OpponentHand`, historique, `GameOverOverlay`), `EventManager`, contrôleurs (`GameFlowState`, `AnimationQueue`, `StateSyncController`, `ServerEventPlayer`, `InputController`), protocole.

## 3. Explication bloc par bloc

- `create()` : fond, contrôleurs, abonnement aux événements, nettoyage à la destruction, `sendReady()`.
- `onConnected()` : première connexion → `ready`/`readySolo` ; **reconnexion** → vide la file d'animations et envoie `resume` (le serveur renverra l'état complet).
- `onServerState` : appliqué tout de suite, ou mis en attente si des animations sont en cours (`AnimationQueue`).
- `onServerRejected` : non fatal → `showNotice(raison)` (texte qui s'efface, rien dans la console) et annulation de l'action en cours ; fatal → écran de fin avec l'explication.
- `onGameOver(gagnant, récompenses)` : après la fin des animations, `GameOverOverlay` « YOU WIN!! » / « YOU LOSE :( » + ligne « +2 packs · Elo +16 · new card back unlocked! ».
- `shutdown()` : désabonne **tous** les écouteurs (pas de fuite).

## 4. Flux concret

Coupure réseau de 5 s : socket.io se reconnecte → `resume` → état complet → la table se recale.

## 5. Points d'attention

- Les deux envois de `ready` (création de la scène + connexion) sont normaux : le serveur ignore le second.

## 6. Questions probables en évaluation

- **Comment le client gère-t-il une reconnexion ?** `onConnected` → `resume` → état complet.
- **Comment les récompenses sont-elles affichées ?** Dans l'écran de fin, d'après le message `gameOver`.
