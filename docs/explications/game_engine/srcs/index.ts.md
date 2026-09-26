# `game_engine/srcs/index.ts`

> Service : **game_engine** · TypeScript · ~50 lignes · point d'entrée du serveur de jeu.

## 1. Rôle

Démarre le serveur de jeu : filets de sécurité contre les erreurs non gérées, remise à zéro de
la présence « en partie », lancement du serveur socket.io sur le port 4000, préchargement du
catalogue de cartes.

## 2. Dépendances

- **Importe** : `dotenv/config` (variables d'environnement en local), `socket/serverSocket.ts`,
  `cardImport/cardLoader.ts` (`ensureCatalogLoaded`), `presence.ts` (`resetInGamePresence`).
- **Utilisé par** : `npm run dev` (ts-node) / `node dist/index.js` (production), voir
  `game_engine/Dockerfile`.

## 3. Explication bloc par bloc

```ts
process.on("unhandledRejection", (reason) => console.error(…));
process.on("uncaughtException", (err) => console.error(…));
```

Par défaut, Node **s'arrête** sur une promesse rejetée non gérée : une seule requête fautive
terminerait **toutes** les parties en cours. On journalise et on continue.

```ts
void resetInGamePresence();   // les parties ne survivent pas à un redémarrage
createGameServer(4000);
preloadCatalog();             // avec jusqu'à 15 essais espacés de 2 s
```

`preloadCatalog` charge les ~76 cartes en mémoire dès le démarrage, pour que le premier joueur
n'attende pas. Il **réessaie** car, au démarrage à froid, `game_engine` peut interroger la base
avant que le conteneur `app` ait fini les migrations et le seed.

## 4. Flux concret

`make` → le conteneur `game_engine` lance `ts-node srcs/index.ts` → « Game server listening… »
puis « Card catalog loaded: 76 cards » dès que le seed est terminé.

## 5. Points d'attention

- Le port 4000 n'est pas exposé sur l'hôte : on passe toujours par nginx (HTTPS).

## 6. Questions probables en évaluation

- **Que se passe-t-il si le serveur de jeu redémarre en pleine partie ?** Les parties (en
  mémoire) sont perdues ; la présence « en partie » est remise à zéro au démarrage.
