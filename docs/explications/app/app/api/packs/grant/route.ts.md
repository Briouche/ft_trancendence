# `app/app/api/packs/grant/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · outil de test : paquet gratuit

## 1. Rôle

`POST /api/packs/grant` (**développement uniquement**) : +1 paquet non ouvert.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/session.ts`, `lib/devTools.ts`.

## 3. Explication bloc par bloc

404 en production ; sinon `unopenedPacks: { increment: 1 }` (incrément atomique).

## 4. Flux concret

Bouton « Get a free pack (temporary) » de `/packs` en dev.

## 5. Points d'attention

- Désactivé en production.

## 6. Questions probables en évaluation

- **Comment obtient-on des paquets en vrai ?** Victoires (moyen, difficile, PvP) et succès.
