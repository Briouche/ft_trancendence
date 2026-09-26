# `app/app/collection/CollectionBook.tsx`

> Service : **app** · Client Component · le carnet de collection

## 1. Rôle

Carnet à deux pages : onglet **cartes** (recherche texte, filtre de coût, légendaires seulement, pagination par double page, zoom) et onglet **dos de cartes** (équiper un dos débloqué, indice pour les verrouillés).

## 2. Dépendances

- **Importe** : `CardFace`/`ScaledCardFace`, `CardBackArt`, `lib/cardBacks.ts`, `NotebookUI` (`Slot`, `PageArrow`, `SearchInput`, `normalize`, `parseCost`…), `ScaleToFit`, `./CardZoom`.

## 3. Explication bloc par bloc

- `filteredCards` (`useMemo`) : recherche sans accents sur nom/description/rareté, filtre de coût (1 couvre aussi 0), tri par coût.
- Pagination : `SLOTS_PER_PAGE` cartes par double page.
- `chooseBack(index)` : `POST /api/user/card-back`.
- `SideTab` : onglets en marque-page.

## 4. Flux concret

Rechercher « pyro » → seules les cartes correspondantes restent.

## 5. Points d'attention

- Mise à l'échelle par `ScaleToFit` (mise en page fixe).

## 6. Questions probables en évaluation

- Aucune spécifique.
