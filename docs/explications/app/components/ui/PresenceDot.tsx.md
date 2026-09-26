# `app/components/ui/PresenceDot.tsx`

> Service : **app** · Composant React · indicateur de présence

## 1. Rôle

Pastille de couleur (vert en ligne, orange en partie, gris hors ligne) + le statut en texte (visible avec `showLabel`, sinon réservé aux lecteurs d'écran).

## 2. Dépendances

- **Importe** : `lib/presenceTypes.ts`.
- **Utilisé par** : `UserRow`, `ChatWindow`, `PlayerSearch`, `PublicProfileView`, vitrine.
- **Design system** : composant listé dans `docs/DESIGN_SYSTEM.md`, visible sur `/design-system`.

## 3. Explication bloc par bloc

`DOT_COLOR` + `PRESENCE_LABEL` ; la pastille est `aria-hidden`, le texte est toujours présent.

## 4. Flux concret

Un ami entre en partie → pastille orange « In a match ».

## 5. Points d'attention

- L'état n'est **jamais** donné par la couleur seule (accessibilité).

## 6. Questions probables en évaluation

- **Comment le statut en ligne est-il affiché ?** Par ce composant, mis à jour en direct.
