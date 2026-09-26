# Design system

Référence vivante : la page **`/design-system`** de l'application affiche chaque token et chaque
composant ci-dessous, rendus par le vrai code
([DesignSystemShowcase.tsx](../app/app/design-system/DesignSystemShowcase.tsx)).

## Direction artistique

Un « carnet de voyage » en pixel art posé sur une table en bois : pages de parchemin, cadres et
boutons dessinés (pack *Complete UI Book Styles*, textures dans `app/public/textures/`), une
seule police pixel. Les cadres sont des images 9-slice appliquées en `border-image`, ce qui
permet de les étirer à n'importe quelle taille sans déformer les coins.

## Tokens

Déclarés une seule fois dans [app/globals.css](../app/app/globals.css) (bloc `@theme`), donc
disponibles comme classes Tailwind (`bg-ink-950`, `text-gold-300`…). Les matériaux three.js du
hub reprennent les mêmes valeurs dans [components/library/theme.ts](../app/components/library/theme.ts).

| Token | Valeur | Usage |
|---|---|---|
| `ink-950` / `ink-900` / `ink-800` | `#0b0c0d` / `#15171a` / `#1f2225` | fonds sombres |
| `parchment-100…300` | `#d4d6d3` → `#9a9d9b` | texte sur fond sombre |
| `leather-700…900` | `#5a5e62` → `#33363a` | bordures, surfaces secondaires |
| `gold-300…500` | `#cbb883` → `#8f8058` | accents, sélection, progression |
| `ink-text` / `ink-muted` | `#3b2c18` / `#6d5a3e` | texte sur parchemin |
| `radius-btn` / `radius-card` | `0.5rem` / `1rem` | arrondis |

**Typographie** : une police, *PixelGame* (`--font-pixel-game`), exposée sous les alias
`font-display`, `font-serif`, `font-pixel`… pour pouvoir en changer par rôle plus tard. Échelle
utilisée : `text-xs` (libellés, en capitales espacées), `text-sm`/`text-base` (corps), `text-2xl`
(titres de panneau), `text-4xl`/`text-5xl` (titre de page).

**Icônes** : sprites animés de `AssetButton` (`home`, `back`, `manual`, `about`,
`achievement`) + emoji pour les listes (portés par du texte, jamais seuls : chaque icône a un
libellé accessible).

## Composants

| # | Composant | Fichier | Utilisé dans |
|---|---|---|---|
| 1 | `PageShell` — mise en page défilante (fond, bouton accueil, titre) | `components/ui/PageShell.tsx` | amis, chat, joueurs, profils, succès, design system |
| 2 | `Panel` — panneau parchemin encadré, pleine largeur sur mobile | `components/ui/Panel.tsx` | toutes les pages ci-dessus |
| 3 | `TextButton` / `TextLink` — boutons texte (primary / secondary / danger) | `components/ui/TextButton.tsx` | amis, chat, profils, profil, succès |
| 4 | `Field` — champ texte avec libellé | `components/ui/Field.tsx` | amis, design system |
| 5 | `Avatar` — avatar encadré avec repli sur l'avatar par défaut | `components/ui/Avatar.tsx` | amis, chat, joueurs, profils |
| 6 | `PresenceDot` — présence (couleur + texte pour lecteurs d'écran) | `components/ui/PresenceDot.tsx` | amis, chat, joueurs, profils |
| 7 | `TierBadge` — badge bronze/argent/or | `components/ui/TierBadge.tsx` | profils publics, succès |
| 8 | `ProgressBar` — barre `role="progressbar"` | `components/ui/ProgressBar.tsx` | succès |
| 9 | `Pagination` — page précédente / suivante | `components/ui/Pagination.tsx` | joueurs |
| 10 | `EmptyState` — liste vide | `components/ui/EmptyState.tsx` | amis, chat, profils |
| 11 | `Toast` / `useToast` — notifications | `components/ui/Toast.tsx` | layout, hub, paquets, chat, amis, succès |
| 12 | `AssetButton` — bouton sprite animé (icônes) | `components/notebook/NotebookUI.tsx` | hub, toutes les pages carnet |
| 13 | `HomeButton`, `TitleBanner`, `Slot`, `PageArrow`, `SearchInput`, `SelectHighlight` | `components/notebook/NotebookUI.tsx` | collection, decks, jeu, manuel, paquets |
| 14 | `ScaleToFit` — met à l'échelle une page à mise en page fixe | `components/ScaleToFit.tsx` | pages carnet |
| 15 | `CardFace` / `ScaledCardFace` / `CardBackArt` — cartes | `components/` | collection, decks, paquets |
| 16 | `NoticePage` / `NoticeSection` — pages légales | `components/` | privacy, terms |

## Règles d'usage

- Couleurs et polices uniquement via les tokens (pas de code hexadécimal en dur dans les
  composants, sauf `theme.ts` pour three.js).
- Pages de listes : `PageShell` + `Panel` (se réorganisent sur mobile). Pages « livre » à
  mise en page fixe : `ScaleToFit`.
- Tout bouton sans texte visible reçoit un `ariaLabel`. Un état n'est jamais transmis par la
  couleur seule (voir `PresenceDot`).
- Focus clavier visible (`focus-visible:ring-gold-400`) sur les champs.
