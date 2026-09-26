# `app/app/deck/new/DeckBuilder.tsx`

> Service : **app** · Client Component · le constructeur de deck

## 1. Rôle

À gauche la collection (recherche, filtres, pagination) ; à droite le deck en cours (compteurs légendaire / autres), son nom, la sauvegarde, et la liste des decks existants (ouvrir, supprimer avec confirmation). Clic gauche = ajouter, clic droit = retirer.

## 2. Dépendances

- **Importe** : `CardFace`, `ScaledCardFace`, `ScaleToFit`, `NotebookUI`, `lib/deckRules.ts`, `lib/validation.ts` (`DECK_NAME_MAX_LENGTH`).

## 3. Explication bloc par bloc

- `canAdd(card)` : pas plus que les exemplaires possédés, 1 légendaire max, 20 autres max (mêmes règles que le serveur).
- `saveDeck` : `POST /api/decks` (nouveau) ou `PUT /api/decks/:id` ; affiche le message d'erreur du serveur sinon.
- `deleteDeck` : `DELETE /api/decks/:id`.

## 4. Flux concret

Construire un deck de 21 cartes → Save → « Deck saved! » → redirection vers `/deck/<id>`.

## 5. Points d'attention

- Le client aide, le serveur décide (`lib/decks.ts`).

## 6. Questions probables en évaluation

- **Comment les règles de deck sont-elles garanties ?** Même module `deckRules.ts` côté client et serveur.
