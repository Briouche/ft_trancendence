# `app/prisma/seeds/cards.seed.ts`

> Service : **app** · script TypeScript · seed des cartes

## 1. Rôle

Lit `data/tcg-collection.json`, **upsert** chaque carte (stats, mots-clés, effets JSON), puis supprime les cartes qui ne sont plus dans le fichier (et leurs occurrences dans les collections et decks).

## 2. Dépendances

- **Importe** : `@prisma/client`, `fs`, `path`, `./effectSpec`.
- **Utilisé par** : `prisma/seed.ts`.

## 3. Explication bloc par bloc

- `KEYWORD_LABELS` : libellé du JSON → valeur de l'énumération ; un libellé inconnu arrête le seed avec un message clair.
- Upsert idempotent : relancer le seed ne duplique rien.

## 4. Flux concret

Ajouter une carte au JSON → redémarrer `app` → elle existe en base.

## 5. Points d'attention

- Le serveur de jeu garde le catalogue en cache : le redémarrer après un changement de cartes.

## 6. Questions probables en évaluation

- **Comment ajoute-t-on une carte ?** Une entrée dans le JSON + son image.
