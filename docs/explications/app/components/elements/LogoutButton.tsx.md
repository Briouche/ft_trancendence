# `app/components/elements/LogoutButton.tsx`

> Service : **app** · Composant React · bouton de déconnexion

## 1. Rôle

Formulaire dont l'action est la server action `logoutUser` (supprime le cookie puis redirige).

## 2. Dépendances

- **Importe** : `lib/auth.ts`, `./FormButton`.
- **Utilisé par** : `components/Header.tsx`.

## 3. Explication bloc par bloc

`<form action={logoutUser}>` : fonctionne même sans JavaScript.

## 4. Flux concret

Clic « Log out » → accueil déconnecté.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
