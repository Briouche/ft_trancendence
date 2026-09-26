# `app/app/register/page.tsx`

> Service : **app** · Server Component · ~20 lignes · `/register`.

## 1. Rôle

Page d'inscription (en-tête + `RegisterForm`). Un utilisateur déjà connecté est renvoyé au hub.

## 2. Dépendances

- **Importe** : `components/Header`, `components/RegisterForm`, `lib/session.ts`, `config/routes.ts`.

## 3. Explication bloc par bloc

`metadata.title = "Create an account"` ; `if (await getSession()) redirect("/")`.

## 4. Flux concret

Lien « Create an account » de la page de connexion → ce formulaire.

## 5. Points d'attention

- Toute la validation est dans `RegisterForm` (client) et `lib/auth.ts` (serveur).

## 6. Questions probables en évaluation

- **Comment s'inscrit-on ?** Nom d'utilisateur, email, mot de passe (règles affichées).
