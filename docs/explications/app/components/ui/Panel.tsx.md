# `app/components/ui/Panel.tsx`

> Service : **app** · Composant React · panneau

## 1. Rôle

Panneau parchemin encadré (texture `frame04`) : pleine largeur sur mobile, largeur maximale configurable ensuite. Balise choisie (`section` par défaut) et attributs HTML transmis (ex. `aria-labelledby`).

## 2. Dépendances

- **Utilisé par** : toutes les pages `PageShell`.
- **Design system** : composant listé dans `docs/DESIGN_SYSTEM.md`, visible sur `/design-system`.

## 3. Explication bloc par bloc

Classe `travelbook-frame4-panel` + `w-full` + `max-w-*` + marges intérieures responsives.

## 4. Flux concret

Chaque bloc de `/friends`.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- **Comment rendez-vous les pages responsives ?** `PageShell` + `Panel` + grilles Tailwind qui se réorganisent.
