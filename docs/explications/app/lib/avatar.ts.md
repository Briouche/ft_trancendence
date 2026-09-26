# `app/lib/avatar.ts`

> Service : **app** · TypeScript (client et serveur) · ~10 lignes.

## 1. Rôle

`avatarUrl(nomDeFichier)` : `/api/avatars/<fichier>` si l'utilisateur a un avatar, sinon
l'avatar par défaut `/avatars/default.svg`.

## 2. Dépendances

- **Utilisé par** : `lib/users.ts`, `components/ui/Avatar.tsx`, routes avatar, pages profil/chat.

## 3. Explication bloc par bloc

`DEFAULT_AVATAR_URL` + la fonction.

## 4. Flux concret

`User.avatar = null` → silhouette par défaut.

## 5. Points d'attention

- Rien de particulier.

## 6. Questions probables en évaluation

- **Y a-t-il un avatar par défaut ?** Oui, `app/public/avatars/default.svg`.
