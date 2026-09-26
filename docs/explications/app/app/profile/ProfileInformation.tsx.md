# `app/app/profile/ProfileInformation.tsx`

> Service : **app** · Client Component · mon profil

## 1. Rôle

Trois panneaux : **avatar** (`AvatarUploader`), **compte** (nom, email, Elo ↔ formulaire d'édition, lien vers le profil public), **compte 42** (lié, ou bouton « Link 42 account »).

## 2. Dépendances

- **Importe** : `PageShell`, `Panel`, `TextButton`/`TextLink`, `./AvatarUploader`, `./EditProfileForm`, `config/routes.ts`.

## 3. Explication bloc par bloc

`isEditing` bascule entre lecture et formulaire ; le lien de liaison est un `<a>` (navigation complète vers la route API, qui redirige vers 42).

## 4. Flux concret

Lier 42 → retour → « 42 account linked ».

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- **Peut-on lier son compte 42 après coup ?** Oui, ici.
