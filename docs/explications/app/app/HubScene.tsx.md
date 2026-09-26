# `app/app/HubScene.tsx`

> Service : **app** · Client Component (three.js / React Three Fiber) · ~865 lignes · le hall 3D.

## 1. Rôle

Le menu principal sous forme de **bibliothèque en 3D** : une salle circulaire bordée
d'étagères, avec un objet cliquable par destination (fauteuil → Collection, table de cartes →
Deck Builder, bibliothécaire → paquets, porte → partie, tableau de liège → tutoriel).

## 2. Dépendances

- **Importe** : `@react-three/fiber` (`Canvas`, `useFrame`), `@react-three/drei`
  (caméra, `RoundedBox`, `Sparkles`, `Html`, `useTexture`), `three`,
  `components/library/Lantern`, `Candle`, `theme.ts`, `./menu.ts`, `./AccountMenu`.
- **Utilisé par** : `app/HubBackground.tsx` (import dynamique).

## 3. Explication bloc par bloc

- **Géométrie** : `RING_RADIUS`, angles des étagères et torches, `LAYOUT` (position et type d'objet
  pour chaque route du menu), `polar()` (angle + rayon → x, z).
- `pseudoRandom(seed)` : hasard **déterministe** (mêmes livres à chaque rendu ; un rendu React doit
  être pur).
- **Décor** : `Bookshelf` (livres en `instancedMesh` = un seul objet GPU pour des centaines de
  livres), `BookshelfCaissons`, `WallTorch`, lampes, coffre, `Librarian`, `Armchair`, `DeckTable`,
  `CellarDoor`, `TutoBoard`, fumée, brume, brasero, `Moth`.
- `Hotspot3D` : un objet + son étiquette + une **zone cliquable invisible** ; survol → mise en
  valeur ; clic → `onArrive(item)` → navigation.
- `HubCamera` : garde un **champ de vision horizontal constant** quel que soit le format de
  l'écran (la rangée d'objets reste cadrée).
- `HubScene` (export) : `Canvas` + scène + `AccountMenu` en surimpression ; `active` met en pause
  le rendu quand le hub est caché.

## 4. Flux concret

Clic sur la porte → `router.push("/play")` → transition vers l'écran de jeu ; le hub reste monté
en arrière-plan.

## 5. Points d'attention

- Les performances viennent de l'instanciation et du rendu suspendu hors de `/`.
- Sur petit écran, `HubBackground` affiche le menu texte à la place.

## 6. Questions probables en évaluation

- **Pourquoi du 3D ?** Choix esthétique pour le hub ; tout y est aussi accessible par le menu
  texte (sans WebGL ou sur mobile) et par le menu du compte.
