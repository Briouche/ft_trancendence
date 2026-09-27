# `app/app/api/packs/open/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · ouvrir un paquet

## 1. Rôle

`POST /api/packs/open` : ouvre un paquet (`lib/packs.ts`) ; renvoie les cartes tirées, les paquets restants, le compteur de légendaire garantie et le dos débloqué si ce paquet complète la collection.

## 2. Dépendances

- **Importe** : `lib/prisma.ts`, `lib/api.ts`, `lib/packs.ts`.

## 3. Explication bloc par bloc

`NoPackError` → 400 ; toute autre erreur remonte (500, journalisée par Next).

## 4. Flux concret

Choisir un paquet → animation → cartes révélées → si la collection est complète, le dos « Complete the full card collection » est débloqué.

## 5. Points d'attention

- L'interface empêche d'ouvrir sans paquet : le 400 ne se produit pas en usage normal.

## 6. Questions probables en évaluation

- **Et si deux ouvertures arrivent en même temps ?** Une seule consomme le dernier paquet (voir `lib/packs.ts`).
