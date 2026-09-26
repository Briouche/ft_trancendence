# `app/components/Footer.tsx`

> Service : **app** · Server Component · pied de page légal

## 1. Rôle

Liens **Privacy Policy** et **Terms of Service**, rendus par le layout sur **toutes les pages**, épinglés en bas à gauche (la plupart des pages sont des scènes plein écran).

## 2. Dépendances

- **Importe** : `next/link`, `config/english.tsx`, `config/routes.ts`.
- **Utilisé par** : `app/layout.tsx`.

## 3. Explication bloc par bloc

`<footer>` fixe, `<nav aria-label="Legal">`, petits caractères sur fond semi-opaque.

## 4. Flux concret

Visible même en pleine partie, sans recouvrir la main du joueur.

## 5. Points d'attention

- Exigence du sujet : pages légales accessibles depuis le pied de page de toutes les pages.

## 6. Questions probables en évaluation

- **Où sont les liens légaux ?** Ici, sur chaque page.
