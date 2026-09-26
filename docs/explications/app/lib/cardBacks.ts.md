# `app/lib/cardBacks.ts`

> Service : **app** · TypeScript (client et serveur) · ~30 lignes · dos de cartes.

## 1. Rôle

Catalogue des 8 dos de cartes cosmétiques : ceux de départ (0, 1, 2), ceux gagnés par succès
(première victoire par mode : 3 à 6 ; collection complète : 7), les textes d'indice, et la
validation d'un index.

## 2. Dépendances

- **Utilisé par** : `lib/packs.ts`, `lib/achievements.ts`, routes `collection/clear`,
  `collection/unlock-all`, `user/card-back`, `user/summary`, page collection et succès.
- **Doit rester cohérent avec** : `game_engine/srcs/socket/serverSocket.ts` (`CARD_BACK_COUNT`)
  et `game_engine/srcs/matchResults.ts` (`CARD_BACK_FOR_WIN`).

## 3. Explication bloc par bloc

Constantes + `isValidCardBack(value)` (entier dans [0, 8[).

## 4. Flux concret

Choisir un dos dans la collection → `POST /api/user/card-back` vérifie qu'il est débloqué.

## 5. Points d'attention

- Ajouter un dos : image `public/textures/cards/backs/<n>.webp`, `CARD_BACK_COUNT` ici et dans le
  serveur de jeu.

## 6. Questions probables en évaluation

- **Les dos de cartes sont-ils des récompenses ?** Oui, des badges visuels de la gamification.
