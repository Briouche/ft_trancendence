# `app/components/game/PhaserLoader.tsx`

> Service : **app** · Client Component · chargement sans SSR

## 1. Rôle

Charge `GameLauncher` **uniquement dans le navigateur** (`next/dynamic`, `ssr: false`) : Phaser a besoin d'un canvas et d'un DOM réels. Affiche `SceneLoading` pendant le téléchargement du bundle.

## 2. Dépendances

- **Importe** : `next/dynamic`, `library/SceneLoading`.
- **Utilisé par** : `app/play/game/page.tsx`.

## 3. Explication bloc par bloc

Un seul composant qui transmet les paramètres de la partie.

## 4. Flux concret

Ouverture de `/play/game`.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
