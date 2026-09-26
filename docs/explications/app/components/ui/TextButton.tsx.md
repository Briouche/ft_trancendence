# `app/components/ui/TextButton.tsx`

> Service : **app** · Composant React · boutons texte

## 1. Rôle

`TextButton` (bouton) et `TextLink` (lien, même apparence), en trois variantes : `primary`, `secondary`, `danger`.

## 2. Dépendances

- **Importe** : `next/link`.
- **Utilisé par** : amis, chat, profils, profil, succès, vitrine.
- **Design system** : composant listé dans `docs/DESIGN_SYSTEM.md`, visible sur `/design-system`.

## 3. Explication bloc par bloc

Styles communs (hauteur minimale 40 px pour le tactile, effet d'appui, état désactivé) + classes de la variante ; `type="button"` par défaut (pas de soumission accidentelle).

## 4. Flux concret

« Accept », « Remove », « Send »…

## 5. Points d'attention

- Utiliser `AssetButton` pour les boutons-icônes en sprite.

## 6. Questions probables en évaluation

- Aucune spécifique.
