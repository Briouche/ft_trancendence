# `app/app/manual/ManualBook.tsx`

> Service : **app** · Client Component · le tutoriel

## 1. Rôle

Carnet illustré qui explique le jeu : objectif, plateau, mana, anatomie d'une carte (légendes numérotées), attaque et provocation, mots-clés, légendaires et leurs passifs.

## 2. Dépendances

- **Importe** : `CardFace`, `ScaleToFit`, `NotebookUI`, `next/image`.

## 3. Explication bloc par bloc

Données en constantes (`KEYWORDS`, `CARD_ANATOMY`, `LEGENDARIES`, cartes d'exemple réelles) ; composants de présentation (`IllustratedSection`, `Callout`, captures `ObjectiveShot`, `BoardShot`…).

## 4. Flux concret

L'évaluateur demande les règles → ouvrir le Tuto.

## 5. Points d'attention

- Le glossaire doit rester cohérent avec `EFFECT_LABELS` (`game/objects/card/CardPreview.ts`).

## 6. Questions probables en évaluation

- **Les règles sont-elles expliquées au joueur ?** Oui, ici.
