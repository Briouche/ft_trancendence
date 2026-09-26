# `app/lib/deckRules.ts`

> Service : **app** · TypeScript (client et serveur) · ~10 lignes · règles de construction.

## 1. Rôle

Règles partagées par le constructeur de deck (navigateur) et l'API (serveur) : rareté
« Légendaire », au plus 1 légendaire, au plus 20 autres cartes.

## 2. Dépendances

- **Utilisé par** : `lib/decks.ts`, `app/deck/new/DeckBuilder.tsx`.

## 3. Explication bloc par bloc

Trois constantes.

## 4. Flux concret

Le bouton « + » d'une carte se grise quand la limite est atteinte (client) ; l'API refuse aussi
(serveur).

## 5. Points d'attention

- Un seul endroit à changer pour modifier la taille d'un deck.

## 6. Questions probables en évaluation

- **Quelles sont les règles d'un deck ?** 1 légendaire max, 20 autres cartes max, et pas plus
  d'exemplaires que ceux possédés.
