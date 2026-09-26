# `app/app/profile/AvatarUploader.tsx`

> Service : **app** · Client Component · upload d'avatar

## 1. Rôle

Aperçu de l'avatar, bouton « Change avatar » (sélecteur de fichier), « Use default » ; vérifie **type et taille côté client** avant l'envoi (le serveur revérifie tout).

## 2. Dépendances

- **Importe** : `ui/Avatar`, `ui/TextButton`, `lib/avatar.ts`.

## 3. Explication bloc par bloc

`ACCEPTED` (PNG, JPEG, WebP) et `MAX_BYTES` (2 Mo) ; `FormData` → `POST /api/user/avatar` ; `DELETE` pour revenir au défaut.

## 4. Flux concret

Choisir un PDF → « Only PNG, JPEG and WebP images are accepted. » sans appel réseau.

## 5. Points d'attention

- La vérification client est un confort : le type réel est contrôlé par le serveur sur les octets.

## 6. Questions probables en évaluation

- **Validez-vous l'upload des deux côtés ?** Oui.
