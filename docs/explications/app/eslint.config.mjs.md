# `app/eslint.config.mjs`

> Service : **app** · configuration ESLint · lint de l’application

## 1. Rôle

Règles de lint de Next.js (`core-web-vitals` + TypeScript), variables inutilisées tolérées si préfixées par `_`. `npm run lint` → 0 problème.

## 2. Dépendances

- `eslint-config-next`.

## 3. Explication bloc par bloc

Ignore `.next`, `next-env.d.ts`, le point d'entrée Phaser recopié (`game/phaserVendor`, code tiers) et `uploads/`.

## 4. Flux concret

`cd app && npx eslint .`.

## 5. Points d'attention

- Les règles React récentes (`react-hooks/set-state-in-effect`, `purity`) sont respectées.

## 6. Questions probables en évaluation

- **Le code passe-t-il le lint ?** Oui, dans les trois services.
