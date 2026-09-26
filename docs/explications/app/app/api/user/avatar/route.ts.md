# `app/app/api/user/avatar/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · upload d'avatar

## 1. Rôle

`POST` (multipart, champ `avatar`) : remplace l'avatar. `DELETE` : revient à l'avatar par défaut.

## 2. Dépendances

- **Importe** : `next/cache`, `lib/prisma.ts`, `lib/api.ts`, `lib/avatar.ts`, `lib/avatarStorage.ts`, `lib/rateLimit.ts`.

## 3. Explication bloc par bloc

1. Session.
2. `Content-Length` trop grand → 413 avant même de lire le corps.
3. 10 changements / heure.
4. Fichier présent, ≤ 2 Mo.
5. **Type détecté sur les octets** (PNG/JPEG/WebP) sinon 415.
6. Enregistré sous un nom aléatoire, `User.avatar` mis à jour, ancien fichier supprimé.

## 4. Flux concret

« Change avatar » → sélection d'un fichier → aperçu mis à jour.

## 5. Points d'attention

- nginx limite aussi la taille du corps (`client_max_body_size 3m`).

## 6. Questions probables en évaluation

- **Comment sécurises-tu l'upload ?** Type par signature, taille, nom généré, stockage hors web ; voir aussi `api/avatars/[file]`.
