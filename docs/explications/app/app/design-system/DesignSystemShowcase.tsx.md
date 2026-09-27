# `app/app/design-system/DesignSystemShowcase.tsx`

> Service : **app** · Client Component · ~140 lignes · vitrine du design system.

## 1. Rôle

Affiche **en vrai** chaque token et chaque composant réutilisable : couleurs (valeur et rôle),
typographie, icônes (`AssetButton`), boutons et liens, champs, identité (`Avatar`,
`PresenceDot`), progression (`ProgressBar`), pagination, liste vide, cartes.

## 2. Dépendances

- **Importe** : tous les composants de `components/ui/`, `NotebookUI` (`AssetButton`,
  `SearchInput`, `Slot`), `CardBackArt`, `useToast`.

## 3. Explication bloc par bloc

- `COLORS` : les tokens de `globals.css` (nom, valeur, usage).
- `Section` : un `Panel` avec titre.
- Chaque section rend les composants avec des données d'exemple ; le bouton « Show a toast »
  déclenche une vraie notification.

## 4. Flux concret

L'évaluateur ouvre la page : chaque élément est interactif (survol, clic).

## 5. Points d'attention

- Ajouter un composant réutilisable → l'ajouter ici et dans `docs/DESIGN_SYSTEM.md`.

## 6. Questions probables en évaluation

- **Montrez 10 composants réutilisés.** Cette page + la table d'usage de `docs/DESIGN_SYSTEM.md`.
