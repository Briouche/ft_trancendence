# `app/app/api/avatars/[file]/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · servir un avatar

## 1. Rôle

`GET /api/avatars/:file` : renvoie l'image d'un avatar enregistré.

## 2. Dépendances

- **Importe** : `lib/avatarStorage.ts`.

## 3. Explication bloc par bloc

- Nom de fichier validé (format généré par le serveur uniquement) → pas de `../`.
- En-têtes : `Content-Type` fixé par le serveur, `X-Content-Type-Options: nosniff` (le navigateur ne devine pas le type), `Content-Security-Policy: default-src 'none'; sandbox` (même ouvert directement, le fichier ne peut rien exécuter), cache d'un an (nom unique par upload).

## 4. Flux concret

`<img src="/api/avatars/1-….png">` sur un profil.

## 5. Points d'attention

- Publique : un avatar n'est pas une donnée secrète.

## 6. Questions probables en évaluation

- **Un avatar piégé peut-il exécuter du code ?** Non : type vérifié à l'upload, servi comme image, `nosniff` et CSP sandbox.
