# `app/lib/userSearch.ts`

> Service : **app** · TypeScript (serveur) · ~90 lignes · recherche de joueurs / classement.

## 1. Rôle

Une page de résultats de recherche, avec **filtres, tri et pagination faits par la base** : le
coût d'une page ne dépend pas du nombre total de joueurs.

## 2. Dépendances

- **Importe** : `@prisma/client` (types), `lib/prisma.ts`, `lib/presence.ts`, `lib/users.ts`,
  `lib/validation.ts` (type des paramètres).
- **Utilisé par** : `app/api/users/route.ts` (et le type par `app/players/PlayerSearch.tsx`).

## 3. Explication bloc par bloc

- Filtres → `where` : nom contenant `q`, ids en ligne (Redis), ids des amis.
- `orderBy(params)` : Elo, victoires PvP, nom ou date ; **clé secondaire `id`** pour un ordre
  stable (sinon, à Elo égal, un joueur pourrait apparaître sur deux pages ou sur aucune).
- `prisma.$transaction([count, findMany({ skip, take })])` : total et page cohérents.

## 4. Flux concret

`/api/users?q=ka&sort=elo&order=desc&page=2&pageSize=10` → `skip 10, take 10`.

## 5. Points d'attention

- Le filtre « en ligne » passe par une liste d'ids : adapté à la taille du projet.

## 6. Questions probables en évaluation

- **La pagination est-elle côté serveur ?** Oui, `skip/take` dans la requête SQL générée par Prisma.
