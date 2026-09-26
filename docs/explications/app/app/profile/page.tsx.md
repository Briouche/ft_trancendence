# `app/app/profile/page.tsx`

> Service : **app** · Server Component (page) · `/profile`

## 1. Rôle

Son propre profil : lit l'utilisateur, l'URL de son avatar, et le message éventuel du retour de liaison 42 (`?linked=1`, `?error=…`).

## 2. Dépendances

- **Importe** : `lib/session.ts`, `lib/avatar.ts`, `config/routes.ts`, `./ProfileInformation`.

## 3. Explication bloc par bloc

`getCurrentUser()` ; `LINK_MESSAGES` traduit le paramètre en message.

## 4. Flux concret

Menu du compte → Full profile.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
