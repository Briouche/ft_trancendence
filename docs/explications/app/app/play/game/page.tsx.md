# `app/app/play/game/page.tsx`

> Service : **app** · Server Component (page) · `/play/game`

## 1. Rôle

Page de la partie : valide mode, difficulté (liste fermée) et deck depuis l'URL, lit le dos de carte équipé, puis monte le jeu Phaser (`PhaserLoader`).

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/session.ts`, `config/routes.ts`, `components/game/PhaserLoader`.

## 3. Explication bloc par bloc

`getSession()` ; pas de session → redirection vers `/`. `deckId` invalide → retour à `/play` ; difficulté inconnue → « moyen ».

## 4. Flux concret

`/play/game?mode=solo&difficulty=facile&deckId=4`.

## 5. Points d'attention

- Le serveur de jeu revalide tout (propriété du deck, difficulté).

## 6. Questions probables en évaluation

- **Et si on trafique l'URL ?** Valeurs revalidées ici et par le serveur de jeu.
