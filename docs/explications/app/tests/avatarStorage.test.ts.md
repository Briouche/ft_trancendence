# `app/tests/avatarStorage.test.ts`

> Service : **app** · tests (vitest) · upload sécurisé

## 1. Rôle

Vérifie la détection de type par signature (PNG/JPEG/WebP acceptés ; SVG, PHP, GIF, WAV refusés), le format des noms de fichier (aucune traversée de répertoire) et le type MIME servi.

## 2. Dépendances

- **Importe** : `lib/avatarStorage.ts`.

## 3. Explication bloc par bloc

Octets construits à la main.

## 4. Flux concret

`npm test`.

## 5. Points d'attention

- Aucun.

## 6. Questions probables en évaluation

- **Un SVG piégé est-il accepté ?** Non (testé).
