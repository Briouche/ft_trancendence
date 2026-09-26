# `app/app/friends/UserRow.tsx`

> Service : **app** · Composant · une ligne utilisateur

## 1. Rôle

Ligne réutilisable : avatar, nom (lien vers le profil), présence, et des actions à droite. Exporte le type `UserSummary`.

## 2. Dépendances

- **Importe** : `next/link`, `ui/Avatar`, `ui/PresenceDot`, `config/routes.ts`, `lib/presenceTypes.ts`.
- **Utilisé par** : `FriendsPanel`, `ChatFriendList`.

## 3. Explication bloc par bloc

Un `<li>` en flex qui passe à la ligne sur petit écran.

## 4. Flux concret

Chaque ami de la liste.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- Aucune spécifique.
