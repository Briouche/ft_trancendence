# `app/app/menu.ts`

> Service : **app** · TypeScript · ~40 lignes · destinations du hub.

## 1. Rôle

Liste des 5 destinations du hub (Collection, Deck Builder, Librarian = paquets, Game room =
partie, Tuto) avec libellé, description, emoji, disponibilité.

## 2. Dépendances

- **Utilisé par** : `app/HubScene.tsx` (objets 3D), `app/SimpleHubMenu.tsx` (liens).

## 3. Explication bloc par bloc

Type `MenuItem` + tableau `MENU_ITEMS`.

## 4. Flux concret

Ajouter une entrée ici l'ajoute au menu texte ; pour la salle 3D, il faut aussi une place dans
`LAYOUT` (`HubScene.tsx`).

## 5. Points d'attention

- Les pages sociales (amis, chat, joueurs, succès) sont dans le menu du compte, pas ici.

## 6. Questions probables en évaluation

- Aucune spécifique.
