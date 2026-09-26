# `app/game/EventManager.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · TypeScript · pont socket ↔ Phaser

## 1. Rôle

Ouvre **la** connexion socket.io vers le serveur de jeu (`io()` : même origine, chemin `/socket.io/`, via nginx en WSS) et fait le pont avec le reste du client par un bus d'événements (`EventEmitter`) :
- messages du serveur → événements `server:*` (`server:state`, `server:event`, `server:prompt`, `server:rejected`, `server:gameOver`…) ;
- événements `client:*` émis par l'interface (`client:playCard`, `client:requestAttack`, `client:endTurn`…) → messages envoyés au serveur.

## 2. Dépendances

- **Importe** : `events` (`EventEmitter`), `socket.io-client`, `shared/protocol.ts`.
- **Utilisé par** : `scenes/GameScene.ts`, `gameProcessors/InputController.ts`, `objects/*`, `components/game/GameLauncher.tsx`.

## 3. Explication bloc par bloc

- Connexion créée **au chargement du module** : un seul socket pour toute la vie de la page (il survit aux navigations côté client ; d'où l'envoi explicite de `client:quit` en quittant la partie).
- `connect` → `client:connected` (la scène envoie `ready` ou `resume`).
- `connect_error` : un seul message par série d'échecs (socket.io réessaie en boucle) ; `unauthenticated` → « Session expired — please sign in again. ».
- `message` → aiguillage par `msg.type` vers `server:*` ; `gameOver` transmet aussi les récompenses.
- Un écouteur par `client:*` qui construit le `ClientMessage` typé et fait `socket.emit("message", msg)`.

## 4. Flux concret

Le joueur glisse une carte : `InputController` émet `client:playCard` → ce module envoie `{ type: "playCard", cardId, boardIndex }` → le serveur répond par des `event` et un `state` → `server:event` / `server:state` → `GameScene`.

## 5. Points d'attention

- Le client ne décide rien : il n'envoie que des **intentions**, validées par le serveur.

## 6. Questions probables en évaluation

- **Comment le client communique-t-il avec le serveur de jeu ?** Par ce module (socket.io sur WSS).
- **Le socket est-il authentifié ?** Oui, par le cookie de session envoyé au handshake (vérifié côté serveur).
