# `socket-server/eslint.config.js`

> Service : **socketio** · configuration ESLint.

## 1. Rôle

Règles de lint du serveur de chat : jeu recommandé d'ESLint pour JavaScript, globales Node,
modules ES. Lancement : `npm run lint`.

## 2. Dépendances

- `@eslint/js`, `globals`.

## 3. Explication bloc par bloc

Ignore `node_modules`, applique `js.configs.recommended`, déclare `ecmaVersion: 2024` et
`sourceType: "module"` (le fichier utilise `import` et un `await` au niveau racine).

## 4. Flux concret

`cd socket-server && npm run lint` → aucune erreur attendue.

## 5. Points d'attention

- Rien de particulier.

## 6. Questions probables en évaluation

- **Le code est-il linté ?** Oui, les trois services ont leur configuration ESLint.
