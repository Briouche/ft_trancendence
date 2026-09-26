# `app/app/api/packs/open/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · ouvrir un paquet

## 1. Rôle

`POST /api/packs/open` : ouvre un paquet (`lib/packs.ts`) puis évalue les succès (« Pack Rat », « Collector », « Completionist ») ; renvoie les cartes, les paquets restants (récompenses incluses) et les succès débloqués.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/api.ts`, `lib/packs.ts`, `lib/achievements.ts`.

## 3. Explication bloc par bloc

`NoPackError` → 400 ; toute autre erreur remonte (500, journalisée par Next).

## 4. Flux concret

Choisir un paquet → animation → cartes révélées → toast si un succès tombe.

## 5. Points d'attention

- L'interface empêche d'ouvrir sans paquet : le 400 ne se produit pas en usage normal.

## 6. Questions probables en évaluation

- **Et si deux ouvertures arrivent en même temps ?** Une seule consomme le dernier paquet (voir `lib/packs.ts`).
