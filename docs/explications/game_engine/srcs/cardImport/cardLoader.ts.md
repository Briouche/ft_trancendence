# `game_engine/srcs/cardImport/cardLoader.ts`

> Service : **game_engine** · TypeScript · ~280 lignes · cartes et decks depuis la base.

## 1. Rôle

- Charge le **catalogue** de cartes (table `Card`) en mémoire, une fois par processus.
- Transforme une ligne de la base en objet du moteur (`MinionCard` / `SpellCard`).
- Construit les decks d'une partie : depuis un **deck sauvegardé** d'un joueur (avec
  vérification de propriété et de possession des cartes) ou depuis une **liste de noms** (IA).

## 2. Dépendances

- **Importe** : `@prisma/client` (types), `db.ts`, `card.ts`, `deck.ts`, `legendary.ts`,
  `effectFactory.ts` (`buildEffect`).
- **Utilisé par** : `index.ts` (préchargement), `socket/serverSocket.ts` (decks),
  `effectFactory.ts` (jetons invoqués : `rawToMinionCard`).

## 3. Explication bloc par bloc

- `CARD_SELECT` : colonnes lues (évite de charger ce qui ne sert pas).
- `resolveLegendaryPassive(legendId)` : le passif si c'est une légendaire.
- `safeNumber` : coût/attaque/PV sont des chaînes en base ; `"X"` devient 0.
- `rawToMinionCard` / `rawToCard` : construisent la carte ; chaque colonne JSON d'effet passe par
  `buildEffect`. L'id devient `préfixe + id + _n` pour être unique dans la partie.
- **Catalogue** :
  - `waitForSettledCardCount()` : au démarrage à froid, le seed (lancé par le conteneur `app`)
    peut être en cours ; on compte les cartes jusqu'à ce que le nombre se stabilise, pour ne pas
    garder en cache un catalogue à moitié rempli ;
  - `ensureCatalogLoaded()` : mémoïsé (tous les appels partagent le même chargement), et un échec
    efface la mémoire pour qu'on réessaie ;
  - `catalogFor(keys, …)` : si une carte demandée est introuvable, relit le catalogue (au plus
    toutes les 30 s).
- **Decks** :
  - `makeDeckFromIds`, `makeDeckFromNames` (IA, sans contrôle de propriété) ;
  - `makeDeckFromDeckId(deckId, ownerId)` :

```ts
const deck = await prisma.deck.findUnique({ where: { id: deckId }, select: { userId, cards } });
if (!deck || deck.cards.length === 0) return null;
if (deck.userId !== ownerId) return null;                        // pas son deck
const owned = await prisma.userCard.findMany({ where: { userId: ownerId, cardId: { in: … } } });
if (deck.cards.some(dc => (ownedQty.get(dc.cardId) ?? 0) < dc.qty)) return null;  // cartes non possédées
```

`null` → le serveur répond « Deck not found or empty ».

## 4. Flux concret

Alice lance une partie avec le deck 4 : `makeDeckFromDeckId(4, aliceId, "hey")` → vérifie que le
deck est à elle et qu'elle possède toutes les cartes → 21 objets carte construits depuis le
catalogue en mémoire.

## 5. Points d'attention

- Re-seeder la base pendant que le serveur tourne laisse le catalogue en cache périmé jusqu'au
  prochain échec de recherche (ou un redémarrage).
- La vérification de possession existe **en plus** de celle de l'API des decks : des decks
  anciens ou une collection réduite ne doivent pas permettre de tricher.

## 6. Questions probables en évaluation

- **Peut-on jouer avec des cartes qu'on n'a pas ?** Non : vérifié à la sauvegarde du deck
  (`app/lib/decks.ts`) **et** au lancement de la partie (ici).
