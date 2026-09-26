# `app/game/objects/card/CardPreview.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · Objet Phaser (TypeScript) · aperçu agrandi

## 1. Rôle

Grande vue d'une carte avec la liste de ses mots-clés, affichée après un survol prolongé ou quand une carte est jouée.

## 2. Dépendances

- **Utilisé par** : `card/Card.ts` (survol), `ServerEventPlayer` (carte jouée).

## 3. Explication bloc par bloc

`attachCardPreviewHover` / `detachCardPreviewHover` (délai de survol, nettoyage) ; `showCardPreview(scène, données, durée)`.

## 4. Flux concret

L'adversaire joue une carte → elle s'affiche en grand quelques secondes.

## 5. Points d'attention

- `EFFECT_LABELS` doit rester cohérent avec le glossaire du manuel.

## 6. Questions probables en évaluation

- Aucune spécifique.
