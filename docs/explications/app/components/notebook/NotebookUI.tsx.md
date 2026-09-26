# `app/components/notebook/NotebookUI.tsx`

> Service : **app** · Client Component · composants du « carnet »

## 1. Rôle

Briques des pages « livre » : `SelectHighlight` (cadre doré animé), `NotebookScrollArea` (défilement avec barre en sprite, glissable), `Slot` (case de carte : clic = ajouter, clic droit = retirer), `AssetButton` (bouton sprite animé en 4 images, variantes icônes avec **nom accessible**), `PageArrow`, `SearchInput` (valeur transmise 150 ms après la dernière frappe), `HomeButton`, `TitleBanner`, styles et utilitaires (`normalize`, `parseCost`, `HALF`, `SLOTS_PER_PAGE`, `woodenTableBackground`).

## 2. Dépendances

- **Importe** : `next/image`.
- **Utilisé par** : collection, decks, paquets, jeu, manuel, profil, amis (via `PageShell`), hub.
- **Design system** : composant listé dans `docs/DESIGN_SYSTEM.md`, visible sur `/design-system`.

## 3. Explication bloc par bloc

- `useLoopFrame` : boucle d'animation par `requestAnimationFrame`, arrêtée au démontage.
- `AssetButton` : le `onClick` est appelé **après** l'animation d'appui ; `aria-label`, `aria-expanded`, `aria-pressed`.

## 4. Flux concret

Bouton maison en haut à droite de chaque page.

## 5. Points d'attention

- Les variantes d'icônes correspondent aux dossiers de `public/textures/notebook/`.

## 6. Questions probables en évaluation

- **Vos boutons icônes sont-ils accessibles ?** Oui, `ariaLabel` pour les icônes.
