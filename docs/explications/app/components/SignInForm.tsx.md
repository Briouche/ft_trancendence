# `app/components/SignInForm.tsx`

> Service : **app** · Client Component · formulaire de connexion

## 1. Rôle

Nom d'utilisateur **ou email** + mot de passe (validation `loginSchema`, puis server action `checkCredentials`), bouton « Sign in with 42 », lien vers l'inscription. Affiche l'erreur OAuth reçue (`initialError`).

## 2. Dépendances

- **Importe** : `lib/auth.ts`, `lib/validation.ts`, `config/routes.ts`, `NotebookUI`, `ScaleToFit`.

## 3. Explication bloc par bloc

Le bouton 42 est un `<a href="/api/auth/42">` (navigation complète vers la route qui redirige vers 42).

## 4. Flux concret

Saisir son email et son mot de passe → hub.

## 5. Points d'attention

- Un seul message d'erreur générique (ne révèle pas quels comptes existent).

## 6. Questions probables en évaluation

- **Peut-on se connecter par email ?** Oui.
