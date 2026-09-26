# `app/app/api/cards/route.ts`

> Service : **app** · Route API (Next.js Route Handler) · catalogue des cartes

## 1. Rôle

`GET /api/cards` : le catalogue complet (données de jeu, identiques pour tous), **public** et mis en cache 5 minutes.

## 2. Dépendances

- **Importe** : `next/cache` (`unstable_cache`), `lib/prisma.ts`.

## 3. Explication bloc par bloc

`unstable_cache(() => prisma.card.findMany(...), ['cards-catalog'], { revalidate: 300 })` : une requête en base toutes les 5 minutes au plus.

## 4. Flux concret

Utilisé par des outils de test ; les pages lisent la base directement.

## 5. Points d'attention

- Données non personnelles : pas de session requise (volontaire).

## 6. Questions probables en évaluation

- **Pourquoi pas de vérification de session ?** Le catalogue n'a rien de privé.
