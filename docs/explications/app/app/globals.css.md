# `app/app/globals.css`

> Service : **app** · CSS (Tailwind 4) · ~265 lignes · styles globaux et tokens.

## 1. Rôle

- Importe Tailwind et déclare les **tokens du design system** dans `@theme` (couleurs `ink-*`,
  `parchment-*`, `leather-*`, `gold-*`, `ink-text`, `ink-muted`, polices, rayons, espacements) :
  ils deviennent des classes (`bg-ink-950`, `text-gold-300`…).
- Définit les **cadres pixel art** en `border-image` (9-slice) : `.book-panel`,
  `.travelbook-page`, `.travelbook-title-banner`, `.travelbook-frame4-panel`, `.travelbook-slot`,
  `.travelbook-slot03a`, `.travelbook-deck-frame`.
- Déclare les animations (ouverture de paquet, révélation de légendaire).
- Masque le curseur natif (remplacé par `CustomCursor`).

## 2. Dépendances

- **Utilisé par** : `app/layout.tsx` (import global) ; les classes sont utilisées partout.

## 3. Explication bloc par bloc

Le **9-slice** : `border-image-slice` découpe l'image en 9 zones ; les coins restent fixes, les
bords et le centre s'étirent → un même cadre s'adapte à toutes les tailles sans déformer les coins.
`image-rendering: pixelated` garde le pixel art net.

## 4. Flux concret

`<section className="travelbook-frame4-panel">` → un panneau parchemin encadré (composant
`Panel`).

## 5. Points d'attention

- Ajouter une couleur : dans `@theme`, puis l'utiliser par son nom de classe (voir
  `docs/DESIGN_SYSTEM.md`).

## 6. Questions probables en évaluation

- **Quelle solution de style utilisez-vous ?** Tailwind CSS 4 avec des tokens `@theme`, plus
  quelques classes utilitaires pour les cadres pixel art.
