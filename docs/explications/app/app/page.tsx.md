# `app/app/page.tsx`

> Service : **app** · Server Component · ~35 lignes · la page d'accueil `/`.

## 1. Rôle

Visiteur : affiche le **formulaire de connexion** (avec le message d'erreur OAuth éventuel).
Utilisateur connecté : ne rend rien — le hub (monté par le layout) occupe l'écran.

## 2. Dépendances

- **Importe** : `lib/session.ts`, `components/Header`, `components/SignInForm`.
- **Utilisé par** : Next.js (route `/`).

## 3. Explication bloc par bloc

`OAUTH_ERRORS` traduit le paramètre `?error=` posé par le callback OAuth (`oauth`,
`oauth_email_taken`, `oauth_denied`) en message lisible, passé à `SignInForm` comme
`initialError`.

## 4. Flux concret

Refus sur la page 42 → retour sur `/?error=oauth_denied` → « Sign in with 42 was cancelled. »

## 5. Points d'attention

- Une valeur inconnue de `error` n'affiche rien (pas d'injection de texte arbitraire).

## 6. Questions probables en évaluation

- **Que voit un visiteur non connecté ?** La connexion, le lien d'inscription et les liens légaux.
