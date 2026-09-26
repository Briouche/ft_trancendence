# `app/components/ui/Avatar.tsx`

> Service : **app** · Composant React · avatar

## 1. Rôle

Image d'avatar encadrée en 3 tailles (`sm`, `md`, `lg`), avec repli sur l'avatar par défaut et texte alternatif « <nom>'s avatar ».

## 2. Dépendances

- **Importe** : `lib/avatar.ts`.
- **Utilisé par** : `UserRow`, `ChatWindow`, `PlayerSearch`, `PublicProfileView`, `AvatarUploader`, vitrine.
- **Design system** : composant listé dans `docs/DESIGN_SYSTEM.md`, visible sur `/design-system`.

## 3. Explication bloc par bloc

Un `<img>` simple (les avatars servis par `/api/avatars` n'ont pas besoin de l'optimiseur de Next) avec `loading="lazy"`.

## 4. Flux concret

Liste de 50 joueurs → images chargées au défilement.

## 5. Points d'attention

- L'`alt` rend l'image compréhensible par un lecteur d'écran.

## 6. Questions probables en évaluation

- **Combien de fois ce composant est-il réutilisé ?** Sur 6 écrans.
