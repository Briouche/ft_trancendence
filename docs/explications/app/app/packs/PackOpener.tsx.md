# `app/app/packs/PackOpener.tsx`

> Service : **app** · Client Component · l'ouverture de paquets

## 1. Rôle

Déroulé en 3 phases : **choisir** un des 3 designs → **ouvrir** (animation de déchirure pendant l'appel `/api/packs/open`) → **révéler** les 8 cartes une par une (clic ou barre d'espace), dos de carte débloqué annoncé (collection complète). Affiche paquets restants et « N packs until guaranteed legendary ». En dev : outils de test.

## 2. Dépendances

- **Importe** : `./PackCardCircle`, `./PackCardZoom`, `./PackChoice`, `./PackArt`, `CardBackArt`, `NotebookUI`, `ScaleToFit`, `lib/devTools.ts`.

## 3. Explication bloc par bloc

- `openPack(skin)` : refuse sans paquet ; attend à la fois l'API **et** 600 ms minimum (l'animation reste lisible même si l'API est rapide).
- Écoute de la barre d'espace seulement en phase de révélation (écouteur retiré ensuite).
- `DEV_TOOLS_ENABLED` : boutons de test absents en production.

## 4. Flux concret

Ouvrir un paquet → 8 cartes face cachée en cercle → révéler → une légendaire brille.

## 5. Points d'attention

- Le « 5 » de la garantie est codé ici pour l'affichage (même valeur que `lib/packs.ts`).

## 6. Questions probables en évaluation

- **La garantie de légendaire est-elle calculée côté client ?** Non, côté serveur ; le client ne fait qu'afficher.
