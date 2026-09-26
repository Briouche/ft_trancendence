# `app/app/users/[username]/page.tsx`

> Service : **app** · Server Component (page) · `/users/:username`

## 1. Rôle

Profil public d'un joueur (connectés) ; 404 si le nom n'existe pas.

## 2. Dépendances

- **Importe** : `lib/session.ts`, `lib/profile.ts`, `config/routes.ts`, `./PublicProfileView`.

## 3. Explication bloc par bloc

`generateMetadata` (titre) ; `getPublicProfile(nom, viewerId)` ; `notFound()`.

## 4. Flux concret

Clic sur un nom dans n'importe quelle liste.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- **Peut-on voir le profil d'un autre joueur ?** Oui, ici (sans son email).
