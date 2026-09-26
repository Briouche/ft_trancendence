# `game_engine/eslint.config.mjs`

> Service : **game_engine** · configuration ESLint.

## 1. Rôle

Lint du serveur de jeu : règles recommandées JavaScript + TypeScript (`typescript-eslint`),
globales Node. Variables inutilisées tolérées si préfixées par `_`. `npm run lint`.

## 2. Dépendances

`@eslint/js`, `typescript-eslint`, `globals`.

## 3. Explication bloc par bloc

Ignore `dist/` et `node_modules/`, empile `js.configs.recommended` et
`tseslint.configs.recommended`.

## 4. Flux concret

`cd game_engine && npm run lint` → aucune erreur.

## 5. Points d'attention

- Le style du code (accolades à la ligne) n'est pas imposé par le lint : c'est la convention de ce
  service.

## 6. Questions probables en évaluation

- **Le code est-il linté ?** Oui, dans les trois services.
