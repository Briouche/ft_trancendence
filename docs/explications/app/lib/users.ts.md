# `app/lib/users.ts`

> Service : **app** · TypeScript (serveur) · ~35 lignes · la vue « publique » d'un joueur.

## 1. Rôle

Définit `PublicUser` = ce qu'un joueur peut voir d'un autre : id, nom, URL d'avatar, Elo,
présence. **Jamais** l'email, le hash, l'id 42 ou le `tokenVersion`.

## 2. Dépendances

- **Importe** : `lib/avatar.ts`, `lib/presence.ts`.
- **Utilisé par** : `lib/friends.ts`, `lib/userSearch.ts`, `lib/profile.ts`.

## 3. Explication bloc par bloc

- `publicUserSelect` : le `select` Prisma des seules colonnes publiques (on ne lit même pas les
  autres).
- `toPublicUsers(rows)` : ajoute la présence (une lecture Redis pour toute la liste) et l'URL
  d'avatar.

## 4. Flux concret

`listFriends` → `toPublicUsers(amis)` → JSON renvoyé au navigateur.

## 5. Points d'attention

- Toute nouvelle liste de joueurs doit passer par ce `select` pour ne rien divulguer.

## 6. Questions probables en évaluation

- **Un joueur peut-il voir l'email d'un autre ?** Non : jamais sélectionné dans les requêtes
  publiques.
