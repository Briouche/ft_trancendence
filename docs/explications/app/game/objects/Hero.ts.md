# `app/game/objects/Hero.ts`

> Service : **app** (client de jeu, Phaser 3, navigateur) · Objet Phaser (TypeScript) · héros

## 1. Rôle

Portrait du héros (cadre, nom, PV) et, si le deck a une légendaire, le **compteur de son passif** (ex. « 2/4 » pour Freddy) avec une infobulle et une lueur quand il se déclenche.

## 2. Dépendances

- **Utilisé par** : `board/Board.ts`, `ServerEventPlayer`, `StateSyncController`.

## 3. Explication bloc par bloc

- `setHeroData` : met à jour PV et compteur ; `checkCounterTrigger` joue la lueur quand le compteur atteint son seuil.
- Taille et zones de dépôt recalculées au redimensionnement.

## 4. Flux concret

Freddy : 4ᵉ mort alliée → le badge brille et un squelette apparaît.

## 5. Points d'attention

- Le compteur vient du serveur (`ClientHero.freddy` etc.).

## 6. Questions probables en évaluation

- Aucune spécifique.
