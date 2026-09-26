# `app/lib/avatarStorage.ts`

> Service : **app** · TypeScript (serveur) · ~85 lignes · stockage sécurisé des avatars.

## 1. Rôle

Enregistrer, lire et supprimer les images d'avatar sur disque, **sans jamais faire confiance au
client**.

## 2. Dépendances

- **Importe** : `crypto` (`randomUUID`), `fs/promises`, `path`.
- **Utilisé par** : `app/api/user/avatar/route.ts`, `app/api/avatars/[file]/route.ts`,
  `tests/avatarStorage.test.ts`.

## 3. Explication bloc par bloc

- `AVATAR_MAX_BYTES` : 2 Mo.
- `AVATAR_DIR` : volume Docker `/data/avatars` (hors de `public/`, donc jamais servi directement).
- `detectImageFormat(bytes)` : reconnaît PNG (`89 50 4E 47…`), JPEG (`FF D8 FF`), WebP
  (`RIFF….WEBP`) par leurs **premiers octets** ; le nom et le type MIME envoyés par le navigateur
  sont ignorés (faciles à falsifier).
- `saveAvatar` : nom **généré** `<userId>-<uuid>.<ext>` (le nom d'origine n'est jamais utilisé).
- `isAvatarFileName` : n'accepte que ce format → aucun `../` possible (traversée de répertoire).
- `readAvatar`, `deleteAvatar`, `avatarMime` (type MIME d'après l'extension choisie par le serveur).

## 4. Flux concret

Upload de `photo.png` qui est en réalité du HTML → `detectImageFormat` renvoie `null` → 415.

## 5. Points d'attention

- Changer la taille maximale : ici **et** dans `AvatarUploader.tsx` **et** nginx
  (`client_max_body_size`).

## 6. Questions probables en évaluation

- **Comment sécurises-tu l'upload ?** Type par signature binaire, taille, nom aléatoire, stockage
  hors web, service avec type forcé + `nosniff` + CSP sandbox.
