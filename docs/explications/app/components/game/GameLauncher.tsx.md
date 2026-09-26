# `app/components/game/GameLauncher.tsx`

> Service : **app** · Client Component · lancement du jeu Phaser

## 1. Rôle

Crée le `Phaser.Game` dans un conteneur plein écran, affiche un écran de chargement jusqu'au premier état du serveur, gère les échecs de démarrage (refus, délai de 12 s → « Retry » / « Cancel »), et retourne au hub à la fin.

## 2. Dépendances

- **Importe** : `phaser`, `game/GameConfig.ts`, `game/EventManager.ts`, `library/SceneLoading`.
- **Utilisé par** : `components/game/PhaserLoader.tsx`.

## 3. Explication bloc par bloc

- Effet de démarrage : écoute `server:state` / `server:rejected`, minuteur de 12 s ; tout est retiré au nettoyage.
- Effet du jeu : `new Phaser.Game(...)` ; au démontage, envoie `client:quit` (le socket survit à la navigation, il faut prévenir le serveur) et **détruit** le jeu.

## 4. Flux concret

Quitter la page en pleine partie → le serveur reçoit `quit` → forfait.

## 5. Points d'attention

- Détruire le jeu libère le canvas WebGL et les écouteurs de Phaser.

## 6. Questions probables en évaluation

- **Que se passe-t-il si on quitte la page de jeu ?** Abandon envoyé au serveur ; si l'onglet est fermé, fenêtre de grâce de 30 s.
