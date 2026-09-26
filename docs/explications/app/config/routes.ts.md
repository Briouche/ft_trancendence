# `app/config/routes.ts`

> Service : **app** · TypeScript · chemins des pages

## 1. Rôle

Chemins des pages (`/`, `/register`, `/profile`, `/friends`, `/chat`, `/players`, `/achievements`, `/design-system`, pages légales) et `ROUTES.user(nom)` pour un profil public. Évite d'écrire les URL en dur.

## 2. Dépendances

- **Utilisé par** : pages, composants, routes OAuth.

## 3. Explication bloc par bloc

Un objet constant ; `encodeURIComponent` pour le nom.

## 4. Flux concret

`<Link href={ROUTES.user(u.username)}>`.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
