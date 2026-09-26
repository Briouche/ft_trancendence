# `app/components/ui/Pagination.tsx`

> Service : **app** · Client Component · pagination

## 1. Rôle

Précédent / « Page X of Y » / suivant ; boutons désactivés aux extrémités ; la page courante est annoncée aux lecteurs d'écran (`aria-live`).

## 2. Dépendances

- **Utilisé par** : `PlayerSearch`, vitrine.
- **Design system** : composant listé dans `docs/DESIGN_SYSTEM.md`, visible sur `/design-system`.

## 3. Explication bloc par bloc

`onChange(page)` : c'est le parent qui charge la page depuis le serveur.

## 4. Flux concret

Page 2 → `/api/users?page=2`.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
