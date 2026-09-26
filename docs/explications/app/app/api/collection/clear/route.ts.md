# `app/app/api/collection/clear/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · outil de test : vider la collection

## 1. Rôle

`POST /api/collection/clear` (**développement uniquement**) : vide la collection et remet les dos de cartes de départ.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/session.ts`, `lib/devTools.ts`, `lib/cardBacks.ts`.

## 3. Explication bloc par bloc

404 en production (`DEV_TOOLS_ENABLED`) ; sinon transaction : suppression des `UserCard` + mise à jour des dos.

## 4. Flux concret

Bouton « Clear collection (temporary) » de `/packs` en dev.

## 5. Points d'attention

- Ne jamais retirer le garde `DEV_TOOLS_ENABLED`.

## 6. Questions probables en évaluation

- **Ces boutons de triche existent-ils en production ?** Non (404 + boutons masqués).
